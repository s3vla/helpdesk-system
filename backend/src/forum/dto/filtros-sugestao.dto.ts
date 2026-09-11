import { PaginacaoDto } from '../../common/dto/paginacao.dto';

// GET /forum?pagina=&limite= — sem filtro próprio nesta primeira versão,
// só a paginação já compartilhada por toda listagem do projeto.
export class FiltrosSugestaoDto extends PaginacaoDto {}
