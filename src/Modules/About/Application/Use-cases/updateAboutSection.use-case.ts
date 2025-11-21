import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "src/Modules/Shared/cache.service";
import { AboutRepositoryInterface } from "../../Domain/Repositories/about.repository.interface";
import { UpdateAboutSectionDto } from "../../Interfaces/DTOs/update-about-section.dto";
// import { AboutEntity } from "../../Domain/Entities/about.entity";
import { AboutDto } from "../DTO/about.dto";

// Use case for updating an about section
@Injectable()
export class UpdateAboutSectionUseCase {

    // Injecting the About repository, Cache service and Logger using dependency injection for the use case to interact with the data layer, caching layer and log important information or errors
    constructor(
        @Inject('AboutRepositoryInterface')
        private readonly aboutRepository: AboutRepositoryInterface,
        private readonly cacheService: CacheService,
        private readonly logger: Logger,
    ) {}

    // Method to execute the use case, taking the section ID and a UpdateAboutSectionDto as input, deleting the old section and caching the updated one, and returning a Promise that resolves to the updated AboutEntity
    async execute(aboutId: number, updateAboutSectionDto: UpdateAboutSectionDto): Promise<AboutDto> {

        // Remember to delete item in cache, then set item again after update. use lock?

        const sectionKey = 'about-section';
        const sectionTtl = (60000 * 60) * 24; // 24 hours in milliseconds

        try {

            this.logger.log('Updating about section...');
    
            // Update the about section in the repository
            const updatedAboutSection = await this.aboutRepository.update(aboutId, updateAboutSectionDto);

            if (!updatedAboutSection) {

                this.logger.log('No section was updated.');
                return null;
            }

            this.logger.log('Section successfully updated on database. Deleting the old section from cache...');

            // Deleting the old cached section
            await this.cacheService.del(`${sectionKey}:${aboutId}`);

            this.logger.log('Old section deleted from cache. Caching the updated section...');

            // Caching updated section
            await this.cacheService.set<AboutDto>(`${sectionKey}:${aboutId}`, updatedAboutSection, sectionTtl);
    
            this.logger.log('About section cached successfully');
            
            return updatedAboutSection;
        } catch (err) {

            // Log the error and rethrow a generic error message
            this.logger.error('Error updating the about section:', err);
            throw new Error('Erro ao atualizar a seção.');
        }
    }
}