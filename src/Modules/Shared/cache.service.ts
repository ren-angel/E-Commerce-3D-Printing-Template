import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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

        await this.cache.set(key, value, ttl);
    }
}
