import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import Redlock, { ResourceLockedError } from 'redlock';

// Service for interacting with the cache, providing methods to get and set cached values
@Injectable()
export class CacheService {

    // Injecting the cache manager using the CACHE_MANAGER token and Redlock for distributed locking
    constructor(
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
        @Inject('REDLOCK') private readonly redlock: Redlock,
    ) {}

    // Try to acquire a lock for the specified resource and execute the provided function while holding the lock, ensuring that only one process can execute the critical section at a time. Use this when you need the process to wait until the lock is available and you're sure that blocking the execution is acceptable.
    async withLock<T>(
        resource: string,       // Resource refers to the key or identifier for the lock (e.g., 'product:123')
        ttl: number,            // TTL (Time-To-Live) is the duration in milliseconds for which the lock should be held. TTL must be longer than the longest expected critical section (DB + cache write). Add margin (e.g., expected 1s → TTL 5000ms).
        fn: () => Promise<T>,   // fn is the function to execute while holding the lock, which returns a Promise of type T
    ): Promise<T> {

        // Acquire the lock for the specified resource with the given TTL, which ensures that only one process can execute the critical section at a time
        const lock = await this.redlock.acquire([`locks:${resource}`], ttl);

        try {

            // If the lock is successfully acquired, execute the provided function and return its result
            return await fn();
        } finally {

            // Ensure the lock is released after the function execution, even if an error occurs, to prevent deadlocks.
            // Redlock may auto-release if TTL expired, so we catch and ignore errors on release to avoid unhandled promise rejections
            await lock.release().catch(() => {});
        }
    }

    // Try to acquire a lock for the specified resource and execute the provided function if the lock is acquired, returning null if the lock is not available. Use this when you want to attempt to acquire the lock but don’t want to block the execution.
    // Use tryWithLock for background/async tasks where skipping is OK.
    async tryWithLock<T>(
        resource: string,
        ttl: number,
        fn: () => Promise<T>,
    ): Promise<T | null> {

        try {

            // Attempt to acquire the lock for the specified resource with the given TTL
            const lock = await this.redlock.acquire([`locks:${resource}`], ttl, {
                retryCount: 0, // don’t retry, fail fast
            });

            try {

                // If the lock is successfully acquired, execute the provided function and return its result
                return await fn();
            } finally {

                // Ensure the lock is released after the function execution, even if an error occurs, to prevent deadlocks.
                // Redlock may auto-release if TTL expired, so we catch and ignore errors on release to avoid unhandled promise rejections
                await lock.release().catch(() => {});
            }
        } catch (err) {

            // If the lock could not be acquired because it is already held by another process, return null
            if (err instanceof ResourceLockedError) {

                return null;
            }

            // For any other errors, rethrow the error to be handled by the caller
            throw err;
        }
    }

    // Method to retrieve a value from the cache by its key, returning a Promise that resolves to the value of type T (T means generic type) or undefined if the key does not exist
    async get<T>(key: string): Promise<T | undefined> {

        return this.cache.get<T>(key);
    }

    // Method to retrieve multiple values from the cache by their key, returning a Promise that resolves to the value of type T or undefined if the key does not exist
    async mget<T>(keys: string[]): Promise<(T | undefined)[]> {

        return this.cache.mget<T>(keys);
    }

    // Method to retrieve a list from cache by it's key, starting from the beginning (0) to the last element (-1), returning a Promise that resolves to string[] as lrange always returns a string
    async lrange(listKey: string): Promise<(string[])> {

        return this.redis.lrange(listKey, 0, -1);
    }

    // Method to set a value in the cache with a specified key and TTL (time-to-live) in milliseconds, returning a Promise that resolves when the value is set
    async set<T>(key: string, value: T, ttl: number): Promise<void> {

        // Double check if the value is already in the cache to avoid unnecessary writes
        const cacheExists = await this.cache.get<T>(key);
        if (cacheExists) return;

        // Add up to 60 milliseconds of random jitter to the TTL to prevent cache stampedes
        const jitter = Math.floor(Math.random() * 60);
        ttl += jitter;

        // Set the fetched value in the cache with the specified TTL
        await this.cache.set(key, value, ttl);
    }

    // Method to set multiple values in the cache with their respective keys and a common TTL (time-to-live) in milliseconds, returning a Promise that resolves when all values are set
    async mset<T>(payload: Array<{ key: string; value: T }>, ttl: number): Promise<void> {

        // Extract keys to check for their existence in the cache
        const keys = payload.map(item => item.key);
        const existingItems = await this.cache.mget<T>(keys);
        const existingKeys = Object.keys(existingItems);

        // Filter out items that are already in the cache
        const itemsToSet = payload.filter(item => !existingKeys.includes(item.key));

        // If all items already exist in the cache, no need to proceed
        if (itemsToSet.length === 0) {

            return;
        }

        // Prepare the payload for the cache's mset command, adding jitter to each item's TTL
        const msetPayload = itemsToSet.map(item => {

            // Add up to 60 milliseconds of random jitter to the TTL
            const jitter = Math.floor(Math.random() * 60);

            return {
                key: item.key,
                value: item.value,
                ttl: ttl + jitter,
            };
        });

        // Set the new values in the cache
        await this.cache.mset(msetPayload);
    }

    
    // Method to set/append a value to a list in the cache with a specified key and setting the list's TTL (time-to-live) in milliseconds, returning a Promise that resolves when the stringfied value is set
    async rpush<T>(listKey: string, value: T, ttl: number): Promise<void> {

        // Add up to 60 milliseconds of random jitter to the TTL
        const jitter = Math.floor(Math.random() * 60);
        ttl += jitter;

        // Redis only stores strings, so serialize anything that is not already a string
        const serialized = typeof value === "string"
            ? value
            : JSON.stringify(value);

        await this.redis.rpush(listKey, serialized);

        await this.redis.expire(listKey, ttl, "NX");
    }

    // Method to delete a value from the cache by its key, returning a Promise that resolves when the key is deleted
    async del(key: string): Promise<void> {

        await this.cache.del(key);
    }

    // Method to clear all entries in the cache, returning a Promise that resolves when the cache is reset
    async reset(): Promise<void> {

        await this.cache.clear();
    }

    // Method to set a value in the cache with a specified key and TTL (time-to-live) in seconds, returning a Promise that resolves when the value is set. This method uses a mutex lock to prevent cache stampedes by ensuring that only one process can set the value for a given key at a time. If the value is already present in the cache, it returns the cached value immediately.
    // async setWithLock<T>(key: string, ttl: number, fetcher: () => Promise<T>, lockTtl = 5000): Promise<T> {

    //     // First, check if the value is already in the cache
    //     try {

    //         // Try to acquire the lock and set the value if not present
    //         return await this.withLock(key, lockTtl, async () => {

    //             // Double check if another process has already set the value while we were waiting for the lock
    //             const cacheExists = await this.cache.get<T>(key);
    //             if (cacheExists) return cacheExists;

    //             // Add up to 60 seconds of random jitter to the TTL to prevent cache stampedes
    //             const jitter = Math.floor(Math.random() * 60);
    //             ttl += jitter;

    //             // Fetch the value using the provided fetcher function
    //             const value = await fetcher();

    //             // Set the fetched value in the cache with the specified TTL
    //             await this.cache.set(key, value, ttl);

    //             // Return the value that was set in the cache for convenience
    //             return value;
    //         });
    //     } catch (err) {

    //         // If couldn't get the lock, poll the cache until the writer finishes
    //         const started = Date.now();
    //         const waitTimeout = 3000;

    //         // While the wait timeout has not been reached, keep checking the cache
    //         while (Date.now() - started < waitTimeout) {

    //             const cachedValue = await this.cache.get<T>(key);
    //             if (cachedValue) return cachedValue;

    //             // Wait a short period (100ms) before checking again to avoid busy-waiting, with r being a resolve function of a Promise that resolves after the timeout
    //             await new Promise((r) => setTimeout(r, 100));
    //         }

    //         // If the value is still not in the cache after the timeout, throw an error
    //         throw new Error(`Timeout waiting for cached value ${key} after ${waitTimeout}ms with error "${err.message}"`);
    //     }
    // }

    // async setWithSoftLock<T>(key: string, ttl: number, fetcher: () => Promise<T>, lockTtl = 5000): Promise<T | null> {

    //     // Try to acquire the lock and set the value if not present
    //     const result = await this.tryWithLock(key, lockTtl, async () => {

    //         // Double check if another process has already set the value while we were waiting for the lock
    //         const cacheExists = await this.cache.get<T>(key);
    //         if (cacheExists) return cacheExists;

    //         // Add up to 60 seconds of random jitter to the TTL to prevent cache stampedes
    //         const jitter = Math.floor(Math.random() * 60);
    //         ttl += jitter;

    //         // Fetch the value using the provided fetcher function
    //         const value = await fetcher();

    //         // Set the fetched value in the cache with the specified TTL
    //         await this.cache.set(key, value, ttl);

    //         // Return the value that was set in the cache for convenience
    //         return value;
    //     });

    //     // If couldn't get the lock, return null to indicate that the value was not set
    //     return result;
    // }
}

// key naming: <domain>:<entity>:<id>[:extra]

// 1) Cache Invalidation

// Use `cache.del(key)` to invalidate specific cache entries.
// Refresh cache after write if reading immediately in the same request.

// 2) Patterns & Strategies

//  Cache-aside:

//    Read: Check cache, fallback to DB on miss, set cache.
//    Write: Invalidate related cache on write.

//    Use versioning for lists (e.g., `products:category:${catId}:v${ver}:page:${p}`).

//    Use mutex locks and jitter TTLs to avoid simultaneous cache misses.

// 3) E-commerce Cache Checklist

//  -- Home landing JSON / HTML: Cache, invalidate/version it, TTL 5-60 min.
//  Product page: Cache, TTL 5-30 min.
//  Product lists: Cache, use versioning (e.g., `v${version}`), TTl 1-10 min.
//  -- Search results: Cache, TTL 30s-2 min.
//  Shopping cart: Cache in Redis/(user) session, TTL: session length (e.g., 1d).
//  Shipping rates: Cache, TTL 10-30 min.
//  CMS pages: Cache, TTL 30 min-24h.
//  Static assets (images/CSS/JS): Cache via CDN with long TTL.

// 4) Practical Invalidation Rules

//  Create Product: Invalidate related category/version (INCR products:category:${cat}), search cache, update counts.
//  Update Product: Invalidate product cache, increment category version, clear related cache.
//  Delete Product: Same as update + remove from related caches.

// 5) Where to Cache (Layer)

//  Edge/CDN: Static assets (images, CSS, JS), full HTML pages.
//  Reverse Proxy/Page Cache: Varnish, Cloud CDN for full pages.
//  App-level (Redis): Product pages, search results, sessions.

// 7) Extra Tips/Checklist

//  Secure sensitive caches (e.g., admin data).
//  Monitor cache hit ratio and adjust TTLs.