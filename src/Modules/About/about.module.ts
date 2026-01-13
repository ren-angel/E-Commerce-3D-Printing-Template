import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AuthModule } from 'src/infrastructure/http/modules/auth.module';
import { AboutController } from './Interfaces/Controllers/about.controller';
import { AboutEntity } from './Domain/Entities/about.entity';
import { FindAllAboutSectionsUseCase } from './Application/Use-cases/findAllAboutSections.use-case';
import { FindOneAboutSectionsUseCase } from './Application/Use-cases/findOneAboutSections.use-case';
import { CreateAboutSectionUseCase } from './Application/Use-cases/createAboutSection.use-case';
import { UpdateAboutSectionUseCase } from './Application/Use-cases/updateAboutSection.use-case';
import { UpdateAboutSectionPositionUseCase } from './Application/Use-cases/updateAboutSectionPosition.use-case';
import { DeleteAboutSectionUseCase } from './Application/Use-cases/deleteAboutSection.use-case';
import { AboutRepositoryInterface } from './Domain/Repositories/about.repository.interface';
import { TypeOrmAboutRepository } from './Infrastructure/Persistence/about.repository';

// Module definition for the About section of the application
@Module({
//   imports: [TypeOrmModule.forFeature([AboutEntity]), AuthModule],
  imports: [TypeOrmModule.forFeature([AboutEntity])], // Importing TypeOrmModule with AboutEntity for database operations
  providers: [
    {
      provide: 'AboutRepositoryInterface', // Providing the AboutRepositoryInterface with its TypeORM implementation
      useClass: TypeOrmAboutRepository, // Mapping interface to concrete class. So whenever AboutRepositoryInterface is needed, the TypeOrmAboutRepository class will be used instead, enabling dependency injection
    },
    
    // Use case providers for handling business logic related to about sections
    FindAllAboutSectionsUseCase,
    FindOneAboutSectionsUseCase,
    CreateAboutSectionUseCase,
    UpdateAboutSectionUseCase,
    UpdateAboutSectionPositionUseCase,
    DeleteAboutSectionUseCase,
  ],
  controllers: [AboutController], // Registering the AboutController to handle incoming HTTP requests
})

export class AboutModule {}

// Note on AboutRepositoryInterface:
// The interface is imported only for TypeScript type checking in the use cases.
// NestJS cannot inject interfaces at runtime, so we use the string token
// 'AboutRepositoryInterface' as the DI identifier. The interface itself is not
// used directly in this module, but provides typing when injected elsewhere:
//
// constructor(
//   @Inject('AboutRepositoryInterface')
//   private readonly aboutRepository: AboutRepositoryInterface,
// )
//
// The module maps this token to the concrete implementation (TypeOrmAboutRepository)
// using `useClass`, so Nest knows which class to instantiate at runtime.
