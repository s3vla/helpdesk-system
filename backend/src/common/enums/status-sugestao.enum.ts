// Status de uma sugestão do Fórum — só TECNICO muda (ver
// ForumController.atualizarStatus), colaborador só visualiza. Sem
// transição obrigatória entre valores (ex: não impede pular direto de
// ABERTA pra IMPLEMENTADA) — decisão deliberadamente simples, igual o
// resto do Fórum nesta primeira versão.
export enum StatusSugestao {
  ABERTA = 'ABERTA',
  EM_ANALISE = 'EM_ANALISE',
  IMPLEMENTADA = 'IMPLEMENTADA',
  RECUSADA = 'RECUSADA',
}
