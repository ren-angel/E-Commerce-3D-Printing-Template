import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "src/Modules/Shared/cache.service";
import { AboutRepositoryInterface } from "../../Domain/Repositories/about.repository.interface";
import { CreateAboutSectionDto } from "../../Interfaces/DTOs/create-about-section.dto";
import { AboutEntity } from "../../Domain/Entities/about.entity";

// Use case for creating an about section
@Injectable()
export class CreateAboutSectionUseCase {

    // Injecting the About repository, Cache service and Logger using dependency injection for the use case to interact with the data layer, caching layer and log important information or errors
    constructor(
        @Inject('AboutRepositoryInterface')
        private readonly aboutRepository: AboutRepositoryInterface,
        private readonly cacheService: CacheService,
        private readonly logger: Logger,
    ) {}

    // Method to execute the use case, taking a CreateAboutSectionDto as input, caching the created about section, and returning a Promise that resolves to the created AboutEntity
    async execute(createAboutSectionDto: CreateAboutSectionDto): Promise<AboutEntity> {

        const listKey = 'about-sections:list';
        const sectionKey = 'about-section';
        // const lockTtl = 2000; // 2 seconds in milliseconds
        const sectionTtl = (60000 * 60) * 24; // 24 hours in milliseconds

        try {

            this.logger.log('Creating about section...');
    
            // Create the about section in the repository
            const aboutSection = await this.aboutRepository.create(createAboutSectionDto);
            
            // cache it if it returns the data properly, although it will have to be converted to about dto first

            // do all this with lock because of list consistency?

            // await this.cacheService.del('about-sections:list');
            // or append?
            // await this.cacheService.rpush(listKey, aboutSection.aboutId);

    
            this.logger.log('About section created successfully');
            return aboutSection;
        } catch (err) {

            // Log the error and rethrow a generic error message
            this.logger.error('Error creating about sections:', err);
            throw new Error('Erro ao criar as seção.');
        }
    }
}