import { IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

// GET /chamados/meus?busca=&pagina=&limite= — mesmo campo de texto livre de
// FiltrosChamadoDto.busca (usado em GET /chamados, TECNICO-only), só que
// sem os filtros exclusivos de técnico (status/nível/categoria) que não
// fazem sentido nesta rota — "meus chamados" já é implicitamente "só os
// meus", e a busca aqui sempre cobre os 3 status de uma vez (não há filtro
// de status nesta tela pro colaborador escolher/restringir).
export class BuscaChamadoDto extends PaginacaoDto {
  @IsOptional()
  @IsString()
  busca?: string;
}
