import { IsString, MinLength } from 'class-validator';

export class CriarGrupoDto {
  @IsString()
  @MinLength(1)
  nome: string;
}
