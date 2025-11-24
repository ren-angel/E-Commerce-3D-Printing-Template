import { Module, Global, Logger } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { CacheManagerClient, RedisClientProvider, RedlockProvider } from "./redis.provider";

// Shared module providing common services like caching and Redis clients
@Global()
@Module({
    providers: [CacheService, RedisClientProvider, CacheManagerClient, RedlockProvider, Logger],
    exports: [CacheService, RedisClientProvider, CacheManagerClient, RedlockProvider, Logger],
})

export class SharedModule {}