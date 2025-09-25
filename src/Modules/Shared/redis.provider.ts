import { Provider } from '@nestjs/common';  // Provider interface from NestJS for defining custom providers, with providers being a fundamental part of NestJS's dependency injection system
import Redlock from 'redlock';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// Provider for the Redis client, which retrieves the underlying ioredis client from the cache manager
export const RedisClientProvider: Provider = {
  provide: 'REDIS_CLIENT',
  inject: [CACHE_MANAGER],
  useFactory: (cache: Cache) => {
    
    // Access the underlying ioredis client from the cache manager. Uses the 'as any' type assertion to bypass TypeScript's type checking, as the stores property is not part of the official Cache interface
    return (cache.stores as any).getClient();
  },
};

// Provider for the RedLock instance, which is used for distributed locking with Redis
export const RedlockProvider: Provider = {
  provide: 'REDLOCK',
  inject: ['REDIS_CLIENT'],
  useFactory: (redisClient) => {
    return new Redlock([redisClient], {
      retryCount: 5,        // Number of times to retry acquiring the lock before failing
      retryDelay: 200,      // Time in milliseconds to wait between retries
    });
  },
};