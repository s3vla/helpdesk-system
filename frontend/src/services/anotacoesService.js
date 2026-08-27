// Camada de acesso a dados de "Minhas Anotações" — mesmo padrão de
// tarefasService.js. Todas as rotas já filtram pelo usuário do token no
// backend, então não existe parâmetro "de quem" em nenhuma função.
import { chamarApi } from './apiClient'

// `limite` controla quantas anotações (mais recentes primeiro) carregar de
// uma vez — MinhasAnotacoes.jsx pagina via "carregar mais" (ver
// useListaCarregarMais) em vez de trazer o histórico inteiro sempre,
// pensando em anos de anotações acumuladas.
export async function buscarAnotacoes(token, { limite } = {}) {
  const params = new URLSearchParams()
  if (limite) params.set('limite', limite)
  return chamarApi(`/anotacoes?${params.toString()}`, { token })
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
