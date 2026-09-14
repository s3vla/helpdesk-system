import { IsString, MinLength } from 'class-validator';

export class CriarCategoriaDto {
  @IsString()
  @MinLength(1)
  nome: string;
}
