import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// export interface CacheManager extends Cache {}

// Service for interacting with the cache, providing methods to get and set cached values
@Injectable()
export class CacheService {

    // Injecting the cache manager using the CACHE_MANAGER token, with private access modifier to create and initialize the cache property, and readonly to prevent reassignment after initialization
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

    // Method to retrieve a value from the cache by its key, returning a Promise that resolves to the value of type T (T means generic type) or undefined if the key does not exist
    async get<T>(key: string): Promise<T | undefined> {

        return this.cache.get<T>(key);
    }

    // Method to store a value in the cache with a specified TTL in seconds, returning a Promise that resolves when the value is set
    async set<T>(key: string, value: T, ttl: number): Promise<void> {

        await this.cache.set(key, value, { ttl });
    }

    // Method to delete a value from the cache by its key, returning a Promise that resolves when the key is deleted
    async del(key: string): Promise<void> {

        await this.cache.del(key);
    }

    // Method to clear all entries in the cache, returning a Promise that resolves when the cache is reset
    async reset(): Promise<void> {
        
        await this.cache.reset();
    }
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