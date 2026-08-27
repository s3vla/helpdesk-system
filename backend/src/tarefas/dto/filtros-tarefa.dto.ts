import { IsEnum, IsOptional } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';
import { StatusTarefa } from '../../common/enums/status-tarefa.enum';

// GET /tarefas?status=&pagina=&limite= — `status` opcional permite paginar
// cada coluna do Kanban (A Fazer/Fazendo/Concluído) de forma independente,
// mesmo padrão de BuscaChamadoDto em "Meus Chamados": sem `status`, os 3
// juntos (comportamento antigo).
export class FiltrosTarefaDto extends PaginacaoDto {
  @IsOptional()
  @IsEnum(StatusTarefa, { message: 'Status inválido' })
  status?: StatusTarefa;
}
