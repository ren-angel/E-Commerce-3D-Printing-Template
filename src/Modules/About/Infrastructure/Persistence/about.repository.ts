import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, In, Repository, UpdateResult } from "typeorm";
import { plainToInstance } from "class-transformer";
import { AboutRepositoryInterface } from "src/Modules/About/Domain/Repositories/about.repository.interface";
import { AboutEntity } from "../../Domain/Entities/about.entity";
import { AboutDto } from "../../Application/DTO/about.dto";
import { CreateAboutSectionDto } from "src/Modules/About/Interfaces/DTOs/create-about-section.dto";
import { UpdateAboutSectionDto } from "src/Modules/About/Interfaces/DTOs/update-about-section.dto";

// Implementation of the AboutRepositoryInterface using TypeORM for database operations
@Injectable()
export class TypeOrmAboutRepository implements AboutRepositoryInterface {

    // Injecting the TypeORM repository for the AboutEntity, with the private access modifier to create and initialize the aboutRepository property, and readonly to prevent reassignment after initialization
    constructor(@InjectRepository(AboutEntity) private readonly aboutRepository: Repository<AboutEntity>) {}
    
    // Method to retrieve all about section IDs from the database
    async findAllIds(): Promise<number[]> {
        
        const aboutSections = await this.aboutRepository.find({ select: ['aboutId'] });
        
        return aboutSections.map(section => section.aboutId);
    }

    // Method to retrieve all currently used section positions from the database
    // async findAllSectionPositions(): Promise<number[]> {

    //     const sectionsPositions = await this.aboutRepository.find({ select: ['sectionPosition'] });

    //     return sectionsPositions.map(section => section.sectionPosition);
    // }

    // Method to retrieve all about sections from the database
    async findById(ids: number[]): Promise<AboutDto[] | null> {
        
        // const aboutSections = this.aboutRepository.find({ order: { sectionPosition: 'ASC' }, where: { aboutId: In(ids) } });
        const aboutSections = await this.aboutRepository.find({ where: { aboutId: In(ids) } });
        
        return plainToInstance(AboutDto, aboutSections);
    }
    
    // Method to retrieve a single about section by its ID
    async findOne(aboutId: number): Promise<AboutDto | null> {
        
        const aboutSection = await this.aboutRepository.findOne({ where: { aboutId } });
        
        return plainToInstance(AboutDto, aboutSection);
    }

    // Method to create and save a new about section in the database
    async create(createAboutSectionDto: CreateAboutSectionDto): Promise<AboutDto> {

        // Using a transaction to calculate and set the correct section position atomically
        const newAboutSectionDto = await this.aboutRepository.manager.transaction<AboutDto>(async transactionalEntityManager => {
        
            const { maxPosition } = await transactionalEntityManager
            .createQueryBuilder()                                          // Using QueryBuilder to perform a raw SQL query
            .select('COALESCE(MAX(t.section_position), 0)', 'maxPosition') // COALESCE returns the first non-null value, ensuring maxPosition is 0 if no sections exist
            .from(AboutEntity, 't')                                        // 't' is an alias for the AboutEntity table
            .getRawOne();                                                  // Execute the query and get the raw result

            const newAboutSection = await transactionalEntityManager.save({
                ...createAboutSectionDto,
                sectionPosition: Number(maxPosition) + 1,                  // Set the new section's position to one more than the current maximum
            });

            return plainToInstance(AboutDto, newAboutSection);
        });

        return newAboutSectionDto;
    }

    // Method to update an existing about section by its ID
    async update(aboutId: number, updateAboutSectionDto: UpdateAboutSectionDto): Promise<AboutDto | null> {

        // Checks if entity exists and replaces it
        const preload = await this.aboutRepository.preload({
            aboutId: aboutId,
            ...updateAboutSectionDto,
        });

        if (!preload) return null; // entity not found

        const updated = await this.aboutRepository.save(preload);

        return plainToInstance(AboutDto, updated);
    }

    // Method to update the section position of an about section by its ID
    async updateSectionPosition(aboutId: number, newPosition: number): Promise<AboutDto | null> {

        // Using a transaction to safely and correctly update section positions
        const updatedSectionWithNewPositionDto = await this.aboutRepository.manager.transaction(async transactionalEntityManager => {

            // Checks if entity exists and replaces it
            const preload = await transactionalEntityManager.preload(
                AboutEntity,
                { aboutId }
            );

            if (!preload) return null;                  // entity not found

            const from = preload.sectionPosition;       // Current position
            const to = newPosition;                     // New desired position

            if (from === to) return null;               // No change needed if positions are the same

            if (from > to) {

                // If current position is greater than new position (aka, moving up), increment positions in the range [from, to])
                await transactionalEntityManager.query(
                    `UPDATE about SET section_position = section_position + 1
                    WHERE section_position < ? AND section_position >= ?`,
                    [from, to]
                );
            } else {

                // If current position is less than new position (aka, moving down), decrement positions in the range [from, to])
                await transactionalEntityManager.query(
                    `UPDATE about SET section_position = section_position - 1
                    WHERE section_position > ? AND section_position <= ?`,
                    [from, to]
                );
            }

            // Finally, set the section's position to the new position
            const updatedSection = await transactionalEntityManager.save({
                ...preload,
                sectionPosition: to,
            });

            return plainToInstance(AboutDto, updatedSection);
        });

        return updatedSectionWithNewPositionDto;
    }

    // Method to remove an about section by its ID
    async remove(aboutId: number): Promise<boolean> {

        let deleteResult: DeleteResult;

        // Using a transaction to safely remove the section and adjust positions of remaining sections
        await this.aboutRepository.manager.transaction(async transactionalEntityManager => {

            const section = await transactionalEntityManager.findOneBy(AboutEntity, { aboutId });

            // If the section doesn't exist, set affected rows to 0 and exit
            if (!section) {

                deleteResult = new DeleteResult();
                deleteResult.affected = 0;
                return false;
            }

            const position = section.sectionPosition;

            deleteResult = await transactionalEntityManager.delete(AboutEntity, aboutId);

            // Decrement positions of sections that were below the removed section
            await transactionalEntityManager.query(
                `UPDATE about SET section_position = section_position - 1 WHERE section_position > ?`,
                [position]
            );
        });

        return deleteResult.affected! > 0; // ! = non-null assertion because we know it exists
    }
}