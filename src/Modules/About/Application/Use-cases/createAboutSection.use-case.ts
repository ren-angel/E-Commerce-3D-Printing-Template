import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "src/Modules/Shared/cache.service";
import { AboutRepositoryInterface } from "../../Domain/Repositories/about.repository.interface";
import { CreateAboutSectionDto } from "../../Interfaces/DTOs/create-about-section.dto";
// import { AboutEntity } from "../../Domain/Entities/about.entity";
import { AboutDto } from "../DTO/about.dto";

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
    async execute(createAboutSectionDto: CreateAboutSectionDto): Promise<AboutDto> {

        const listKey = 'about-sections:list';
        const sectionKey = 'about-section';
        const sectionTtl = (60000 * 60) * 24; // 24 hours in milliseconds

        try {

            this.logger.log('Creating about section...');
    
            // Create the about section in the repository
            const newAboutSection = await this.aboutRepository.create(createAboutSectionDto);

            if (!newAboutSection) {

                this.logger.log('No section was created.');
                return null;
            }

            this.logger.log('Section successfully created on database. Appending the result onto its appropriate cache list...');

            // Appending the result to cache list with rpush to avoid multiple inserts overwriting each other
            await this.cacheService.rpush<string>(listKey, newAboutSection.aboutId, sectionTtl)

            this.logger.log('Caching the new section...');

            // Caching newly created section
            await this.cacheService.set(`${sectionKey}:${newAboutSection.aboutId}`, newAboutSection, sectionTtl);
    
            this.logger.log('About section cached successfully');
            return newAboutSection;
        } catch (err) {

            // Log the error and rethrow a generic error message
            this.logger.error('Error creating about sections:', err);
            throw new Error('Erro ao criar as seção.');
        }
    }
}