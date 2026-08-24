import { IsDateString, IsOptional } from 'class-validator';

// Query params de período — compartilhado por GET /chamados/metricas e GET
// /chamados/repeticao (MetricasChamadoDto estende esta classe em vez de
// repetir os dois campos). Ambos opcionais: ausentes = últimos 30 dias (ver
// ChamadosService.resolverPeriodo). Formato esperado: "YYYY-MM-DD" (o que
// um <input type="date"> do frontend já manda).
export class PeriodoChamadoDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
