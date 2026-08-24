// contagem = agrupamento simples (zero-preenche valores de enum, sem corte).
// ranking = ordenado decrescente por total, cortado em `limite` (ver
// ChamadosService.obterMetricas).
export enum TipoMetrica {
  CONTAGEM = 'contagem',
  RANKING = 'ranking',
}
