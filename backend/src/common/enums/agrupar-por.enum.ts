// Chaves possíveis de agrupamento pro Dashboard configurável (GET
// /chamados/metricas + DashboardWidget.agruparPor). `REPETICAO_CATEGORIA`
// é especial: NÃO é um valor aceito por GET /chamados/metricas (ver
// AGRUPAR_POR_METRICA_VALIDOS em dto/metricas-chamado.dto.ts) — só existe
// aqui pra widgets poderem referenciar o agrupamento por categoria +
// palavra-chave (GET /chamados/repeticao), que tem lógica própria demais
// pra caber no motor genérico de agregação.
export enum AgruparPor {
  NIVEL = 'nivel',
  CATEGORIA = 'categoria',
  STATUS = 'status',
  PRIORIDADE = 'prioridade',
  SOLICITANTE = 'solicitante',
  TECNICO_RESPONSAVEL = 'tecnicoResponsavel',
  REPETICAO_CATEGORIA = 'repeticaoCategoria',
}
