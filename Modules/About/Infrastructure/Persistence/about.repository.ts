import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { plainToClass } from "class-transformer";
import { AboutRepositoryInterface } from "src/Modules/About/Domain/Repositories/about.repository.interface";
import { AboutEntity } from "src/Modules/About/Domain/entities/about.entity";
import { AboutDto } from "../../Application/DTO/about.dto";
import { CreateAboutSectionDto } from "src/Modules/About/Interfaces/DTOs/create-about-section.dto";
import { UpdateAboutSectionDto } from "src/Modules/About/Interfaces/DTOs/update-about-section.dto";

// Implementation of the AboutRepositoryInterface using TypeORM for database operations
@Injectable()
export class TypeOrmAboutRepository implements AboutRepositoryInterface {

    // Injecting the TypeORM repository for the AboutEntity, with the private access modifier to create and initialize the aboutRepository property, and readonly to prevent reassignment after initialization
    constructor(@InjectRepository(AboutEntity) private readonly aboutRepository: Repository<AboutEntity>) {}

    // Method to create and save a new about section in the database
    create(createAboutSectionDto: CreateAboutSectionDto) {

        return this.aboutRepository.save(createAboutSectionDto);
    }

    // Method to retrieve all about section IDs from the database
    async findAllIds(): Promise<number[]> {
        
        const aboutSections = await this.aboutRepository.find({ select: ['aboutId'] });

        return aboutSections.map(section => section.aboutId);
    }

    // Method to retrieve all about sections from the database
    findAll(aboutDto: AboutDto, ids: number[]): Promise<AboutDto[] | null> {

        const aboutSections = this.aboutRepository.find({ order: { sectionPosition: 'ASC' }, where: { aboutId: In(ids) } });

        return plainToClass(aboutDto as any, aboutSections) as Promise<AboutDto[] | null>;
    }

    // Method to retrieve a single about section by its ID
    findOne(aboutId: number, aboutDto: AboutDto): Promise<AboutDto | null> {
        
        const aboutSection = this.aboutRepository.findOne({ where: { aboutId } });

        return plainToClass(aboutDto as any, aboutSection) as Promise<AboutDto | null>;
    }

    // Method to update an existing about section by its ID
    update(aboutId: number, updateAboutSectionDto: UpdateAboutSectionDto) {

        return this.aboutRepository.update(aboutId, updateAboutSectionDto);
    }

    // Method to remove an about section by its ID
    remove(aboutId: number) {

        return this.aboutRepository.delete(aboutId);
    }
}