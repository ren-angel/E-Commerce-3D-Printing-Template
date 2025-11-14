import { Inject, Injectable, Logger } from "@nestjs/common";
import { CacheService } from "src/Modules/Shared/cache.service";
import { AboutRepositoryInterface } from "../../Domain/Repositories/about.repository.interface";
import { AboutDto } from "../DTO/about.dto";

@Injectable()
export class FindAllAboutSectionsUseCase {

    constructor(
        @Inject('AboutRepositoryInterface')
        private readonly aboutRepository: AboutRepositoryInterface,
        private readonly cacheService: CacheService,
        private readonly logger: Logger,
    ) {}

    // Method to execute the use case, fetching all about sections, caching the result, and returning a Promise that resolves to an array of AboutEntity
    async execute(): Promise<AboutDto[] | null> {

        const listKey = 'about-sections:list';
        const sectionKey = 'about-section';
        const lockTtl = 2000; // 2 seconds in milliseconds. Lock has to last longer than the function it's running
        const sectionTtl = (60000 * 60) * 24; // 24 hours in milliseconds

        try {

            this.logger.log('Fetching all about sections IDs from cache...');
        
            // Getting the cached IDs
            const rawAboutSectionsIds = await this.cacheService.lrange(listKey); // returns strings
            let aboutSectionsIds = rawAboutSectionsIds.map(id => Number(id)); // convert to numbers

            // if couldn't find any cached IDs, then fetch IDs from the repository and cache them
            if (!aboutSectionsIds || aboutSectionsIds.length === 0) {

                this.logger.log('About sections IDs not found in cache. Fetching from repository...');

                // First, acquire a lock to prevent cache stampede
                aboutSectionsIds = await this.cacheService.withLock(
                    `read:${listKey}`,
                    lockTtl,
                    async () => this.aboutRepository.findAllIds(),
                );

                // If no IDs are found, return null
                if (!aboutSectionsIds || aboutSectionsIds.length === 0) {

                    this.logger.log('No about sections found in repository.');
                    return null;
                }

                this.logger.log('Sections IDs fetched successfully. Caching the result...')

                // Cache the fetched IDs for future requests
                await this.cacheService.rpush<number[]>(listKey, aboutSectionsIds, sectionTtl);
            }

            this.logger.log('Sections IDs cached successfully. Fetching all about sections from cache...');

            // Creating keys for each section based on their IDs
            const keys = aboutSectionsIds.map(id => `${sectionKey}:${id}`);

            // Attempt to fetch all sections from cache using mget for efficiency
            const cachedArr = await this.cacheService.mget<AboutDto | null>(keys);

            // Check if all sections were found in cache by filtering out any null values
            const missesIndexes = [];
            for (let i = 0; i < cachedArr.length; i++) {

                if (cachedArr[i] == null) missesIndexes.push(i);
            }

            // If all sections are found in cache, return them as an array of AboutDto
            if (missesIndexes.length === 0) {
                
                this.logger.log('About sections fetched from cache successfully.');

                return cachedArr as AboutDto[];
            }

            this.logger.log('Cache miss (partial/full). Fetching missing about sections from repository...');

            // Fetch all the missing about sections from the repository and cache each section individually
            // Translates the missing indexes into the corresponding IDs from aboutSectionsIds
            const missedIds = missesIndexes.map(i => aboutSectionsIds[i]);
            
            // Once again, use a lock to prevent cache stampede
            const missingSections = await this.cacheService.withLock(
                `read:${listKey}:fetch`,
                lockTtl,
                async () => this.aboutRepository.findById(missedIds)
            )

            // If no sections are found, return null
            if (!missingSections || missingSections.length === 0) {

                this.logger.log('No about sections found in repository.');
                return null;
            }

            this.logger.log('About sections fetched successfully. Caching the result...');

            // Creating the payload for setting multiple values in the cache, mapping through each section
            const msetPayload = missingSections.map(section => ({
                key: `${sectionKey}:${section.aboutId}`,
                value: section,
            }));

            await this.cacheService.mset(msetPayload, sectionTtl);
        
            // Combine cached sections and newly fetched sections, ensuring the order matches the original IDs
            // Create a map (object that holds key-value pairs and remembers the original insertion order of the keys) for quick lookup of missing sections by their ID
            const missingMap = new Map(missingSections.map(s => [s.aboutId, s]));

            // Map over the original IDs and construct the final result array by pulling from the cached array or the missing sections map
            const result: AboutDto[] = aboutSectionsIds.map((id, index) => {
                return cachedArr[index] ?? missingMap.get(id.toString())!; // ! = non-null assertion because we know it exists
            });

            this.logger.log('About sections cached successfully.');
            return result;

            // If mapping for adjusting the order is necessary:
            // const mapById = new Map<number, AboutDto>();
            // for (const s of aboutSections) {
            //     mapById.set(s.aboutId, s);
            // }

            // Cache each section individually for future requests
            // await Promise.all(
            //     aboutSections.map(async (section) => {

            //         try {

            //             await this.cacheService.set<AboutDto>(`${sectionKey}:${section.aboutId}`, section, sectionTtl);
            //         } catch (err) {

            //             // Log the error but continue caching other sections
            //             this.logger.error(`Error caching about section with ID ${section.aboutId}:`, err);
            //         }
            //     })
            // );

            // Again if mapping needed:
            // const ordered = aboutSectionsIds
            // .map((id) => mapById.get(id))
            // .filter((s): s is AboutDto => s != null);
        } catch (err) {

            // Log the error and rethrow a generic error message
            this.logger.error('Error fetching about sections:', err);
            throw new Error('Erro ao obter as seções "Sobre nós".');
        }
    }
}