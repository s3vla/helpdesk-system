import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { StatusTarefa } from '../../common/enums/status-tarefa.enum';

// PATCH /tarefas/:id — todo campo opcional, mesmo DTO serve tanto pra
// editar título/descrição quanto pra mover de coluna (`status`), já que o
// frontend chama a mesma rota nos dois casos (ver AtualizarWidgetDto pro
// mesmo padrão em outro módulo).
export class AtualizarTarefaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  // `descricao: null` explícito limpa a descrição (mesmo padrão de
  // AtualizarAvisoDto.expiraEm) — @IsOptional trata null como "pular
  // validação", passa direto pro service.
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @IsOptional()
  @IsEnum(StatusTarefa, { message: 'Status inválido' })
  status?: StatusTarefa;
}
