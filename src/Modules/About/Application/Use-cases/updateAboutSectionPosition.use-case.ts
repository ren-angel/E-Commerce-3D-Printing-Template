import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "src/Modules/Shared/cache.service";
import { AboutRepositoryInterface } from "../../Domain/Repositories/about.repository.interface";
import { DomainError, InfrastructureError, InvalidEntityError } from "src/Modules/Shared/custom-errors.exception";
import { AboutDto } from "../DTO/about.dto";

// Use case for updating an about section's position
@Injectable()
export class UpdateAboutSectionPositionUseCase {

    // Injecting the About repository, Cache service and Logger using dependency injection for the use case to interact with the data layer, caching layer and log important information or errors
    constructor(
        @Inject('AboutRepositoryInterface')
        private readonly aboutRepository: AboutRepositoryInterface,
        private readonly cacheService: CacheService,
        private readonly logger: Logger,
    ) {}

    // Method to execute the use case, taking the section ID and a it's new position as input, deleting the outdated section and caching the updated one
    async execute(aboutId: number, beforeId: number | null, afterId: number | null): Promise<boolean> {

        const listKey = 'about-sections:list';
        const sectionKey = 'about-section';

        try {

            if (!aboutId) {
             
                throw new InvalidEntityError('ID da seção é obrigatório para atualização de posição.');
            }

            if (beforeId === undefined || beforeId === null || isNaN(beforeId) || beforeId < 0) {

                throw new InvalidEntityError('ID da seção anterior é obrigatório e deve ser um número válido maior ou igual a zero.');
            }

            if (afterId === undefined || afterId === null || isNaN(afterId) || afterId < 0) {

                throw new InvalidEntityError('ID da seção posterior é obrigatório e deve ser um número válido maior ou igual a zero.');
            }
            
            this.logger.log('Updating section position...');

            // Update the about section in the repository
            const updatedAboutSectionPosition = await this.aboutRepository.updateSectionPosition(aboutId, beforeId, afterId);

            if (!updatedAboutSectionPosition) {

                this.logger.log('Section position didn\'t change.');
                return false;
            }

            this.logger.log('Section position successfully changed on database. Deleting the old cache...');

            // Deleting the stale cache of the about sections for consistency
            const rawAboutSectionsIds = await this.cacheService.lrange(listKey); // returns strings. so convert to numbers later
            
            if (rawAboutSectionsIds && rawAboutSectionsIds.length > 0) {

                const aboutSectionsIds = rawAboutSectionsIds.map(id => Number(id));
                const keysToDelete = aboutSectionsIds.map(id => `${sectionKey}:${id}`);

                await this.cacheService.mdel(keysToDelete);
            }

            this.logger.log('Stale sections cache deleted successfully.');

            return true;
        } catch (err) {

            // Log the error and rethrow a generic error message
            this.logger.error('Error updating the about section\'s position:', err);

            // If it's a known/domain/internal expected error, rethrow
            if (err instanceof DomainError || (err && (err as any).isDomainError)) {

                throw err;
            }

            // Otherwise, it's unexpected -> generic error
            throw new InfrastructureError('Erro ao atualizar a posição da seção.');
        }
    }
}