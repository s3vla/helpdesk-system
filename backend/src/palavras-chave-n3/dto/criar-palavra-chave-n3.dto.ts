import { IsString, MinLength } from 'class-validator';

export class CriarPalavraChaveN3Dto {
  @IsString()
  @MinLength(1)
  palavra: string;
}
