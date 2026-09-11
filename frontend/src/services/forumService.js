// Camada de acesso a dados do Fórum de Sugestões — mesmo padrão de
// avisosService.js, chamarApi() em vez de fetch direto.
import { chamarApi } from './apiClient'

// Resposta já vem paginada ({ itens, total, pagina, totalPaginas }) — os
// itens não passam por nenhum "mapear" próprio, ForumSugestoes.jsx consome
// o formato cru da API direto (mesmo padrão de buscarAvisos).
export async function buscarSugestoes(token, { pagina = 1 } = {}) {
  const params = new URLSearchParams()
  params.set('pagina', pagina)
  return chamarApi(`/forum?${params.toString()}`, { token })
}

// { sugestao, comentarios } — cru da API, sem mapeamento próprio.
export async function buscarSugestaoDetalhe(token, id) {
  return chamarApi(`/forum/${id}`, { token })
}

export async function criarSugestao(token, { titulo, mensagem }) {
  return chamarApi('/forum', { token, metodo: 'POST', corpo: { titulo, mensagem } })
}

export async function criarComentarioForum(token, sugestaoId, mensagem) {
  return chamarApi(`/forum/${sugestaoId}/comentarios`, { token, metodo: 'POST', corpo: { mensagem } })
}

// TECNICO-only no backend (RolesGuard) — colaborador que tentar recebe 403.
export async function atualizarStatusSugestao(token, id, status) {
  return chamarApi(`/forum/${id}/status`, { token, metodo: 'PATCH', corpo: { status } })
}
