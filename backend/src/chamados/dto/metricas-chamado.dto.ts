import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PeriodoChamadoDto } from './periodo-chamado.dto';
import { AgruparPor } from '../../common/enums/agrupar-por.enum';
import { TipoMetrica } from '../../common/enums/tipo-metrica.enum';

// Os 6 agrupamentos que o motor genérico de GET /chamados/metricas sabe
// calcular — deliberadamente SEM AgruparPor.REPETICAO_CATEGORIA (esse tem
// lógica própria demais, ver GET /chamados/repeticao e
// ChamadosService.obterRepeticao). Usar @IsIn com este array em vez de
// @IsEnum(AgruparPor) direto é o que faz `agruparPor=repeticaoCategoria`
// devolver 400 nesta rota especificamente.
export const AGRUPAR_POR_METRICA_VALIDOS = [
  AgruparPor.NIVEL,
  AgruparPor.CATEGORIA,
  AgruparPor.STATUS,
  AgruparPor.PRIORIDADE,
  AgruparPor.SOLICITANTE,
  AgruparPor.TECNICO_RESPONSAVEL,
] as const;

// Tipo TS derivado do array acima (não `AgruparPor` inteiro) — assim o
// compilador já sabe, em ChamadosService.obterMetricas, que
// AgruparPor.REPETICAO_CATEGORIA nunca chega aqui, sem precisar de nenhum
// type-cast manual depois de excluir SOLICITANTE/TECNICO_RESPONSAVEL.
export type AgruparPorMetrica = (typeof AGRUPAR_POR_METRICA_VALIDOS)[number];

export class MetricasChamadoDto extends PeriodoChamadoDto {
  @IsIn(AGRUPAR_POR_METRICA_VALIDOS, {
    message: `agruparPor precisa ser um de: ${AGRUPAR_POR_METRICA_VALIDOS.join(', ')}`,
  })
  agruparPor: AgruparPorMetrica;

  @IsIn([TipoMetrica.CONTAGEM, TipoMetrica.RANKING])
  tipo: TipoMetrica;

  // Só faz sentido quando tipo=ranking (ignorado em silêncio quando
  // tipo=contagem, ver ChamadosService.obterMetricas) — default 10 quando
  // ausente. @Type(() => Number) converte o valor cru da query string
  // (sempre texto) pro number que @IsInt/@Min esperam — o ValidationPipe
  // global já roda com `transform: true` (ver main.ts), então essa
  // conversão acontece automaticamente antes das validações.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number;
}
