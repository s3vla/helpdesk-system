// Camada de acesso a dados de Categoria — mesmo padrão de avisosService.js,
// chamarApi() em vez de fetch direto. Categoria substitui o antigo enum
// fixo (CategoriaChamado no backend); o `nome` já É o valor final de
// exibição/API agora, sem tradução de camada nenhuma (ver
// ticketService.js — CATEGORIA_PARA_API/CATEGORIA_DA_API não existem mais).
import { chamarApi } from './apiClient'

// Qualquer autenticado (colaborador OU técnico) — popula o dropdown de
// "Abrir chamado" dos dois lados.
export async function buscarCategoriasAtivas(token) {
  return chamarApi('/categorias/ativas', { token })
}

// TECNICO-only — Administração → Categorias, inclui as desativadas (é a
// tela onde o técnico reativa/desativa).
export async function buscarCategorias(token) {
  return chamarApi('/categorias', { token })
}

export async function criarCategoria(token, nome) {
  return chamarApi('/categorias', { token, metodo: 'POST', corpo: { nome } })
}

export async function atualizarCategoria(token, id, dados) {
  return chamarApi(`/categorias/${id}`, { token, metodo: 'PATCH', corpo: dados })
}

// Exclusão física — só funciona se a categoria nunca foi usada (backend
// responde 409 com mensagem explicando o motivo quando já está vinculada
// a algum chamado/solução, ver CategoriasService.remover).
export async function removerCategoria(token, id) {
  await chamarApi(`/categorias/${id}`, { token, metodo: 'DELETE' })
}
