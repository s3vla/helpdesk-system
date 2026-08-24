// Camada de acesso a dados de "Minhas Tarefas" — mesmo padrão de
// avisosService.js/dashboardService.js, chamarApi() em vez de fetch direto.
// Todas as rotas já filtram pelo usuário do token no backend (nunca um id
// escolhido aqui), então não existe parâmetro "de quem" em nenhuma função.
import { chamarApi } from './apiClient'

export async function buscarTarefas(token) {
  return chamarApi('/tarefas', { token })
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
