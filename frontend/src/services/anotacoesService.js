// Camada de acesso a dados de "Minhas Anotações" — mesmo padrão de
// tarefasService.js. Todas as rotas já filtram pelo usuário do token no
// backend, então não existe parâmetro "de quem" em nenhuma função.
import { chamarApi } from './apiClient'

export async function buscarAnotacoes(token) {
  return chamarApi('/anotacoes', { token })
}

export async function criarAnotacao(token, conteudo) {
  return chamarApi('/anotacoes', { token, metodo: 'POST', corpo: { conteudo } })
}

export async function atualizarAnotacao(token, id, conteudo) {
  return chamarApi(`/anotacoes/${id}`, { token, metodo: 'PATCH', corpo: { conteudo } })
}

export async function removerAnotacao(token, id) {
  await chamarApi(`/anotacoes/${id}`, { token, metodo: 'DELETE' })
}
