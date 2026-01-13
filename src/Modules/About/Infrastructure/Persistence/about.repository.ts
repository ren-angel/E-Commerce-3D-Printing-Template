import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, EntityManager, In, Repository, UpdateResult } from "typeorm";
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
        return this.aboutRepository.manager.transaction<AboutDto>(async transactionalEntityManager => {
        
            // Fetch the current first section to determine the new section's position
            const first = await transactionalEntityManager.findOne(AboutEntity, {
                order: { sectionPosition: 'ASC' }
            });

            // Calculate the new section position. If there is a first section, place the new one before it. If not, start at position 1.
            const newPosition = first
            ? Number(first.sectionPosition) - 1
            : 1;

            // Save new section with the calculated position
            const newAboutSection = await transactionalEntityManager.save(AboutEntity,
                {
                    ...createAboutSectionDto,
                    sectionPosition: newPosition
                }
            );

            return plainToInstance(AboutDto, newAboutSection);
        });
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

    // Method to update the section position of an about section using neighbor id's (fractional/gap ordering)
    // Honestly, this whole function + amount of space is overkill for just updating position of about sections, which will not have that many entries. But it's a good exercise and a reusable pattern for other similar use-cases, specially because of scalability
    async updateSectionPosition(
        aboutId: number,
        beforeId: number | null,         // ID of the section BEFORE it (can be null)
        afterId: number | null           // ID of the section AFTER it (can be null)
    ): Promise<AboutDto | null> {

        return this.aboutRepository.manager.transaction(async transactionalEntityManager => {

            // Fetch the section that is being moved
            // Do not use preload here because, on a normal update where we send a DTO, we want to replace all fields. Here we only want to change the position
            const moving = await transactionalEntityManager.findOne(
                AboutEntity, {
                where: { aboutId }
            });

            // If it doesn't exist, abort
            if (!moving) return null;

            // If there are no neighbors specified, abort
            if (beforeId === null && afterId === null) return null;

            let newPosition: number;

            // If both beforeId and afterId are provided (aka, moving somewhere in the middle)
            if (beforeId && afterId) {

                // Fetch both neighbor sections in parallel
                let [before, after] = await Promise.all([
                    transactionalEntityManager.findOne(AboutEntity, { where: { aboutId: beforeId } }),
                    transactionalEntityManager.findOne(AboutEntity, { where: { aboutId: afterId } }),
                ]);

                // If either neighbor doesn't exist, abort
                if (!before || !after) return null;

                // If the gap is too small, rebalance all positions
                if (after.sectionPosition - before.sectionPosition < 0.0000000001) {
                    
                    await this.rebalanceAllPositions(transactionalEntityManager);

                    // Re-fetch neighbors after rebalance
                    [before, after] = await Promise.all([
                        transactionalEntityManager.findOne(AboutEntity, { where: { aboutId: beforeId } }),
                        transactionalEntityManager.findOne(AboutEntity, { where: { aboutId: afterId } }),
                    ]);
                }

                // Place the moved section between them
                newPosition = (Number(before.sectionPosition) + Number(after.sectionPosition)) / 2;
            }

            // If moving to the TOP
            else if (!beforeId && afterId) {

                // Fetch the section that will come after the moved one
                const after = await transactionalEntityManager.findOne(AboutEntity, {
                    where: { aboutId: afterId }
                });

                // If the neighbor doesn't exist, abort
                if (!after) return null;

                // Put the moved section BEFORE it
                newPosition = Number(after.sectionPosition) - 1;

            }

            // If moving to the BOTTOM
            else {

                // Fetch the section that will come before the moved one
                const before = await transactionalEntityManager.findOne(AboutEntity, {
                    where: { aboutId: beforeId }
                });

                // If the neighbor doesn't exist, abort
                if (!before) return null;

                // Put the moved section AFTER it
                newPosition = Number(before.sectionPosition) + 1;
            }

            // Finally, set the section's position to the new position
            moving.sectionPosition = newPosition;

            const updatedSection = await transactionalEntityManager.save(moving);

            return plainToInstance(AboutDto, updatedSection);
        });
    }

    // Method to remove an about section by its ID
    async remove(aboutId: number): Promise<DeleteResult> {

        let deleteResult: DeleteResult;

        // Using a transaction to safely remove the section and adjust positions of remaining sections
        await this.aboutRepository.manager.transaction(async transactionalEntityManager => {

            const section = await transactionalEntityManager.findOneBy(AboutEntity, { aboutId });

            // If the section doesn't exist, set affected rows to 0 and exit
            if (!section) {

                return null;
            }

            const position = section.sectionPosition;

            deleteResult = await transactionalEntityManager.delete(AboutEntity, aboutId);

            // Decrement positions of sections that were below the removed section
            await transactionalEntityManager.query(
                `UPDATE about SET section_position = section_position - 1 WHERE section_position > ?`,
                [position]
            );
        });

        return deleteResult!; // ! = non-null assertion because we know it exists
    }

    // Helper method to rebalance all positions to consecutive integers (1,2,3,...)
    private async rebalanceAllPositions(transactionalEntityManager: EntityManager): Promise<void> {

        // Using MySQL user-defined variable to assign consecutive integers based on current ordering
        // The syntax is as follows:
        // @i means a user-defined variable in MySQL
        // := is the assignment operator
        await transactionalEntityManager.query(
            `SET @i := 0;`
        );

        // The variable @i is initialized to 0, and for each row in the ordered result set, it increments @i by 1 and assigns that value to section_position
        await transactionalEntityManager.query(
            `UPDATE about
            SET section_position = (@i := @i + 1)
            ORDER BY section_position;`
        );
    }
}