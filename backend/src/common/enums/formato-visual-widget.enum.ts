// Como o WidgetRenderer (frontend) desenha os dados de um widget — decisão
// puramente de apresentação, não muda o formato da resposta de
// /chamados/metricas nem /chamados/repeticao.
//
// LINHA é diferente dos outros três: não usa o motor genérico de
// /chamados/metricas (agrupamento categórico), usa /chamados/metricas-diarias
// (série temporal) — por isso um widget LINHA não tem `agruparPor` nem
// `tipo` (ver DashboardWidget, ambos nullable).
export enum FormatoVisualWidget {
  BARRA = 'barra',
  PIZZA = 'pizza',
  LISTA = 'lista',
  LINHA = 'linha',
}
