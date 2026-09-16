import { IsString, MinLength } from 'class-validator';

// PATCH /grupos/:id — só o nome é editável (Grupo não tem mais nenhum
// outro campo próprio; membros mudam por POST/DELETE /grupos/:id/membros,
// não por aqui).
export class AtualizarGrupoDto {
  @IsString()
  @MinLength(1)
  nome: string;
}
