import { Controller, UseGuards, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateAboutSectionDto } from '../DTOs/create-about-section.dto';
import { UpdateAboutSectionDto } from '../DTOs/update-about-section.dto';

import { FindAllAboutSectionsUseCase } from '../../Application/Use-cases/findAllAboutSections.use-case';
import { FindOneAboutSectionsUseCase } from '../../Application/Use-cases/findOneAboutSections.use-case';
import { CreateAboutSectionUseCase } from '../../Application/Use-cases/createAboutSection.use-case';
import { UpdateAboutSectionUseCase } from '../../Application/Use-cases/updateAboutSection.use-case';
import { UpdateAboutSectionPositionUseCase } from '../../Application/Use-cases/updateAboutSectionPosition.use-case';
import { DeleteAboutSectionUseCase } from '../../Application/Use-cases/deleteAboutSection.use-case';
import { seconds, Throttle } from '@nestjs/throttler';

// Controller for managing about sections, handling HTTP requests and delegating to use cases
@Controller('about')
@Throttle({ default: { limit: 30, ttl: seconds(60) } }) // Overriding the default throttling for this specific controller 
// @UseGuards(JwtAuthGuard)
export class AboutController {

  // Injecting the necessary use cases for handling about section operations
  constructor(
    private readonly findAllAboutSectionsUseCase: FindAllAboutSectionsUseCase,
    private readonly findOneAboutSectionsUseCase: FindOneAboutSectionsUseCase,
    private readonly createAboutSectionUseCase: CreateAboutSectionUseCase,
    private readonly updateAboutSectionUseCase: UpdateAboutSectionUseCase,
    private readonly updateAboutSectionPositionUseCase: UpdateAboutSectionPositionUseCase,
    private readonly deleteAboutSectionUseCase: DeleteAboutSectionUseCase,
  ) {}

  // Endpoint to retrieve all about sections
  @Get()
  findAll() {

    return this.findAllAboutSectionsUseCase.execute();
  }

  // Endpoint to retrieve a single about section by its ID
  @Get(':aboutId')
  findOne(@Param('aboutId') aboutId: string) {

    // + operator to convert string to number
    return this.findOneAboutSectionsUseCase.execute(+aboutId);
  }

  // Endpoint to create a new about section
  @Post()
  create(@Body() createAboutSectionDto: CreateAboutSectionDto) {

    return this.createAboutSectionUseCase.execute(createAboutSectionDto);
  }

  // Endpoint to update an existing about section by its ID
  @Put(':aboutId')
  update(@Param('aboutId') aboutId: string, @Body() updateAboutSectionDto: UpdateAboutSectionDto) {

    // + operator to convert string to number
    return this.updateAboutSectionUseCase.execute(+aboutId, updateAboutSectionDto);
  }

  // Endpoint to update the position of an about section by its ID
  @Put('position/:aboutId')
  updatePosition(@Param('aboutId') aboutId: string, @Body() body: { beforeId: string | null, afterId: string | null }) {

    // + operator to convert string to number
    return this.updateAboutSectionPositionUseCase.execute(+aboutId, +body.beforeId, +body.afterId);
  }

  // Endpoint to delete an about section by its ID
  @Delete(':aboutId')
  remove(@Param('aboutId') aboutId: string) {
    
    // + operator to convert string to number
    return this.deleteAboutSectionUseCase.execute(+aboutId);
  }
}