import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "src/Modules/Shared/cache.service";
import { AboutRepositoryInterface } from "../../Domain/Repositories/about.repository.interface";
import { DeleteResult } from "typeorm";
import { DomainError } from "src/Modules/Shared/custom-errors.exception";

// Use case for deleting an about section
@Injectable()
export class DeleteAboutSectionUseCase {

    // Injecting the About repository, Cache service and Logger using dependency injection for the use case to interact with the data layer, caching layer and log important information or errors
    constructor(
        @Inject('AboutRepositoryInterface')
        private readonly aboutRepository: AboutRepositoryInterface,
        private readonly cacheService: CacheService,
        private readonly logger: Logger,
    ) {}

    // Method to execute the use case, taking the section ID as input, deleting the section from the database and cache, and returning a Promise that resolves to a DeleteResult
    async execute(aboutId: number): Promise<DeleteResult> {

        const listKey = 'about-sections:list';
        const sectionKey = 'about-section';

        try {

            if (!aboutId) {
             
                throw new DomainError('ID da seção é obrigatório para remoção.');
            }

            this.logger.log('Deleting about section from the database...');
    
            // Deletes the about section in the repository
            const deleted = await this.aboutRepository.remove(aboutId);

            if (!deleted) {

                this.logger.log('No section was deleted.');
                throw new DomainError('Nenhuma seção foi removida.');
            }
            
            this.logger.log('Section successfully deleted from the database. Deleting the section from the cache...');

            // Deleting the section on cache
            await this.cacheService.del(`${sectionKey}:${aboutId}`);
            
            this.logger.log('Cached section successfully deleted. Updating the cached section list...');
    
            // Deleting the section id from the section list cache
            await this.cacheService.lrem<number>(listKey, 0, aboutId);

            this.logger.log('Section list successfully updated');
            
            return deleted;
        } catch (err) {

            // Log the error and rethrow a generic error message
            this.logger.error('Error deleting the about section:', err);

            // If it's a known/domain/internal expected error, rethrow
            if (err instanceof DomainError) {
                throw err;
            }

            // Otherwise, it's unexpected -> generic error
            throw new Error('Erro ao remover a seção.');
        }
    }
}
