// Distingue um comentário real (escrito por alguém) de uma entrada
// automática de auditoria — hoje só existe uma: o registro gerado por
// ChamadosService.reclassificarNivel quando o técnico corrige o nível
// sugerido pela regra automática. Existe como enum (em vez de inferir pelo
// texto) pra o frontend separar "histórico de nível" da conversa de forma
// confiável, sem depender do texto exato da mensagem automática nunca mudar.
export enum TipoComentario {
  COMENTARIO = 'COMENTARIO',
  NIVEL_AJUSTADO = 'NIVEL_AJUSTADO',
}
