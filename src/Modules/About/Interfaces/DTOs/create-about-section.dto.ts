import { IsString, IsNotEmpty, IsNumber, IsPositive, isString } from 'class-validator';

// DTO for creating an about section
export class CreateAboutSectionDto {

  // Section field must be a non-empty string
  @IsString({ message: 'Seção deve ser um texto válido.'})
  @IsNotEmpty({ message: 'Seção não pode estar vazia.'})
  section: string;

  // Section position must be a positive number
  @IsNumber({}, { message: 'Posição da seção deve ser um número válido.' })
  @IsPositive({ message: 'Posição da seção deve ser um número positivo.' })
  sectionPosition: number;

  // Context text must be a non-empty string
  @IsString({ message: 'Texto do conteúdo deve ser um texto válido.'})
  @IsNotEmpty({ message: 'Texto do conteúdo não pode estar vazio.'})
  contentText: string;
}