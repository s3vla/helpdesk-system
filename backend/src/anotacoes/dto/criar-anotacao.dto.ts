import { IsString, MinLength } from 'class-validator';

export class CriarAnotacaoDto {
  @IsString()
  @MinLength(1)
  conteudo: string;
}
