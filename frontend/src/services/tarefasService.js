// Camada de acesso a dados de "Minhas Tarefas" — mesmo padrão de
// avisosService.js/dashboardService.js, chamarApi() em vez de fetch direto.
// Todas as rotas já filtram pelo usuário do token no backend (nunca um id
// escolhido aqui), então não existe parâmetro "de quem" em nenhuma função.
import { chamarApi } from './apiClient'

// `status`, quando passado, restringe a busca a UMA coluna do Kanban
// (A_FAZER/FAZENDO/CONCLUIDO) — é o que permite MinhasTarefas.jsx paginar
// cada coluna de forma independente, com `limite` controlando quantas
// tarefas (mais recentes primeiro) carregar por vez (ver
// useListaCarregarMais), em vez de trazer o histórico inteiro sempre.
export async function buscarTarefas(token, { status, limite } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (limite) params.set('limite', limite)
  return chamarApi(`/tarefas?${params.toString()}`, { token })
}

export async function criarTarefa(token, dados) {
  return chamarApi('/tarefas', { token, metodo: 'POST', corpo: dados })
}

// Mesma rota serve tanto "editar título/descrição" quanto "mover de
// coluna" (`dados.status`) — o backend aceita os dois num único PATCH
// (ver AtualizarTarefaDto).
export async function atualizarTarefa(token, id, dados) {
  return chamarApi(`/tarefas/${id}`, { token, metodo: 'PATCH', corpo: dados })
}

export async function removerTarefa(token, id) {
  await chamarApi(`/tarefas/${id}`, { token, metodo: 'DELETE' })
}
