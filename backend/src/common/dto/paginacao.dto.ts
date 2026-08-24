import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

// Query params de paginação (?pagina=&limite=) — compartilhado por toda
// listagem que pode crescer sem limite (GET /chamados, /chamados/meus,
// /chamados/observando, /usuarios, /solucoes-conhecidas, /avisos). Cada DTO
// de filtro específico estende esta classe (mesmo padrão de
// MetricasChamadoDto extends PeriodoChamadoDto) em vez de repetir os dois
// campos. Sem valor default aqui — ausência vira "página 1, 10 por página"
// só no service (ver calcularPaginacao em resposta-paginada.dto.ts), não
// no DTO, porque a obrigação de decidir o tamanho da página é de quem
// monta a resposta, não de quem só valida a query string.
export class PaginacaoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number;
}
