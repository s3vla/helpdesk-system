import { IsString, MinLength } from 'class-validator';

export class CriarSetorDto {
  @IsString()
  @MinLength(1)
  nome: string;
}
