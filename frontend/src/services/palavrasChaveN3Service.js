// Camada de acesso a dados de PalavraChaveN3 — mesmo padrão de
// categoriasService.js, chamarApi() em vez de fetch direto.
import { chamarApi } from './apiClient'

// TECNICO-only — Administração → Palavras-chave N3.
export async function buscarPalavrasChaveN3(token) {
  return chamarApi('/palavras-chave-n3', { token })
}

export async function criarPalavraChaveN3(token, palavra) {
  return chamarApi('/palavras-chave-n3', { token, metodo: 'POST', corpo: { palavra } })
}

export async function atualizarPalavraChaveN3(token, id, dados) {
  return chamarApi(`/palavras-chave-n3/${id}`, { token, metodo: 'PATCH', corpo: dados })
}

export async function removerPalavraChaveN3(token, id) {
  await chamarApi(`/palavras-chave-n3/${id}`, { token, metodo: 'DELETE' })
}
