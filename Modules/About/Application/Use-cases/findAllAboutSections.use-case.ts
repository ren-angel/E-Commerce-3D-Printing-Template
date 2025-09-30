import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "src/Modules/Shared/cache.service";
import { AboutRepositoryInterface } from "../../Domain/Repositories/about.repository.interface";
import { AboutEntity } from "../../Domain/Entities/about.entity";

@Injectable()
export class FindAllAboutSectionsUseCase {

    constructor(
        @Inject('AboutRepositoryInterface')
        private readonly aboutRepository: AboutRepositoryInterface,
        private readonly cacheService: CacheService,
        private readonly logger: Logger,
    ) {}

    // Method to execute the use case, fetching all about sections, caching the result, and returning a Promise that resolves to an array of AboutEntity
    async execute(): Promise<AboutEntity[]> {

        this.logger.log('Fetching all about sections ids...');

        const cachedSectionsIds = await this.cacheService.get<number[]>('about-sections:list');

        if (cachedSectionsIds) {

            this.logger.log('About sections IDs fetched from cache. Fetching all about sections...');

            const cachedSections = await Promise.all(
                cachedSectionsIds.map(id =>

                    this.cacheService.get<AboutEntity>(`about-section:${id}`)
                )
            );

            return cachedSections.filter(section => section !== null) as AboutEntity[];
        }

        this.logger.log('About sections IDs not found in cache. Fetching from repository...');

        

    }
}