import { IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

// Query params de GET /usuarios (?busca=&pagina=&limite=) — mesmo padrão
// de FiltrosChamadoDto: `busca` é texto livre, sem validação de formato.
export class FiltrosColaboradorDto extends PaginacaoDto {
  @IsOptional()
  @IsString()
  busca?: string;
}
