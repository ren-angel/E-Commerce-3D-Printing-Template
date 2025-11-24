import { Module, Global } from "@nestjs/common";
import { CacheService } from "./cache.service";

// Shared module providing common services like caching across the application
@Global()
@Module({
    providers: [CacheService],
    exports: [CacheService],
})

export class SharedModule {}