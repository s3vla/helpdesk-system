import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

// GET /avisos?incluirExpirados=&pagina=&limite= — "incluirExpirados" só tem
// efeito quando quem pede é TECNICO (AvisosService ignora em silêncio pra
// COLABORADOR, mesmo que o parâmetro venha true). @Transform converte a
// string crua da query ("true"/"false") pro boolean que @IsBoolean espera,
// do mesmo jeito que outros filtros de query string já fazem no projeto
// (ver @Type(() => Number) em MetricasChamadoDto.limite).
export class FiltrosAvisoDto extends PaginacaoDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  incluirExpirados?: boolean;
}
