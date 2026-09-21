// Item de resposta de GET /chamados/metricas-diarias — série temporal, uma
// entrada por dia do período (zero-preenchida, mesmo pra dias sem nenhum
// chamado). `dia` no formato "YYYY-MM-DD", mesma convenção de
// PeriodoChamadoDto.dataInicio/dataFim.
export class MetricaDiariaResponseDto {
  dia: string;
  abertos: number;
  finalizados: number;
}
