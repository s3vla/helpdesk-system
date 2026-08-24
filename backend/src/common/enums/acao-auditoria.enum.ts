// Tipos de ação registrados em LogAuditoria — ver
// log-auditoria/log-auditoria.service.ts para onde cada um é gravado.
// REABERTURA é uma MUDANCA_STATUS especial (status anterior era
// FINALIZADO): ação própria em vez de genérica, pra ficar fácil filtrar/ler
// no histórico sem precisar inspecionar o texto da descrição.
export enum AcaoAuditoria {
  MUDANCA_STATUS = 'MUDANCA_STATUS',
  REABERTURA = 'REABERTURA',
  ATRIBUICAO = 'ATRIBUICAO',
  EDICAO = 'EDICAO',
  COMENTARIO = 'COMENTARIO',
}
