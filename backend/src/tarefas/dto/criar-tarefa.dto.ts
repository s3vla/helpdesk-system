import { IsOptional, IsString, MinLength } from 'class-validator';

export class CriarTarefaDto {
  @IsString()
  @MinLength(1)
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
