import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';
import { StatusChamado } from '../../common/enums/status-chamado.enum';

// GET /chamados/meus?busca=&status=&pagina=&limite= — mesmo campo de texto
// livre de FiltrosChamadoDto.busca (usado em GET /chamados, TECNICO-only),
// sem os filtros exclusivos de técnico (nível/categoria) que não fazem
// sentido nesta rota — "meus chamados" já é implicitamente "só os meus".
//
// `status` é opcional (diferente de FiltrosChamadoDto, aqui existe pra
// suportar paginação POR COLUNA): a tela "Meus Chamados" é um Kanban de 3
// colunas, cada uma carregando/paginando a própria lista de forma
// independente (ver MyTickets.jsx) — sem `status`, a busca continua
// cobrindo os 3 de uma vez (comportamento antigo, usado só internamente
// caso algum outro consumidor precise do total geral).
export class BuscaChamadoDto extends PaginacaoDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsEnum(StatusChamado, { message: 'Status inválido' })
  status?: StatusChamado;
}
