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

        this.logger.log('Creating about section...');
        const aboutSection = await this.aboutRepository.create(createAboutSectionDto);

        // Apply mutex locks
        await this.cacheService.set(`about-section:${aboutSection.aboutId}`, aboutSection, 3600 * 24); // Cache for 24 hours

        this.logger.log('About section created successfully');
        return aboutSection;
    }
}