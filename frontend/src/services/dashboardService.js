// Camada de acesso a dados do Dashboard TI configurável: métricas
// genéricas (GET /chamados/metricas), a métrica especial de repetição
// (GET /chamados/repeticao) e o CRUD de widgets (GET/POST/PATCH/DELETE
// /dashboard/widgets) — mesmo padrão de chamarApi já usado em
// ticketService.js, só separado num arquivo próprio pra não misturar
// "dados de chamado" com "configuração do dashboard".
import { chamarApi } from './apiClient'

// Item de resposta de /chamados/metricas: { chave, rotulo, total }. Sem
// tradução aqui — quem exibe (WidgetRenderer) decide o rótulo final
// conforme o agruparPor, reaproveitando os dicionários que já existem
// (LABEL_CATEGORIA, CORES_STATUS[...].label, CORES_PRIORIDADE[...].label).
export async function buscarMetricas(token, { dataInicio, dataFim, agruparPor, tipo, limite } = {}) {
  const params = new URLSearchParams()
  if (dataInicio) params.set('dataInicio', dataInicio)
  if (dataFim) params.set('dataFim', dataFim)
  params.set('agruparPor', agruparPor)
  params.set('tipo', tipo)
  if (limite) params.set('limite', limite)
  return chamarApi(`/chamados/metricas?${params.toString()}`, { token })
}

// Item de resposta de /chamados/metricas-diarias: { dia, abertos,
// finalizados } — uma entrada por dia do período, zero-preenchida. Usado
// só pelo widget formatoVisual=linha (WidgetRenderer).
export async function buscarMetricasDiarias(token, { dataInicio, dataFim } = {}) {
  const params = new URLSearchParams()
  if (dataInicio) params.set('dataInicio', dataInicio)
  if (dataFim) params.set('dataFim', dataFim)
  const query = params.toString()
  return chamarApi(`/chamados/metricas-diarias${query ? `?${query}` : ''}`, { token })
}

// Item de resposta: { categoria, rotulo, total } — categoria em MAIÚSCULO
// cru (mesmo formato bruto da API, sem tradução; quem usa isso já traduz
// via LABEL_CATEGORIA como o resto do app faz).
export async function buscarRepeticao(token, { dataInicio, dataFim } = {}) {
  const params = new URLSearchParams()
  if (dataInicio) params.set('dataInicio', dataInicio)
  if (dataFim) params.set('dataFim', dataFim)
  const query = params.toString()
  return chamarApi(`/chamados/repeticao${query ? `?${query}` : ''}`, { token })
}

export async function buscarWidgets(token) {
  return chamarApi('/dashboard/widgets', { token })
}

export async function criarWidget(token, { titulo, agruparPor, tipo, formatoVisual, limite }) {
  return chamarApi('/dashboard/widgets', {
    token,
    metodo: 'POST',
    corpo: { titulo, agruparPor, tipo, formatoVisual, ...(limite ? { limite: Number(limite) } : {}) },
  })
}

// `dados` só precisa conter os campos que devem mudar (PATCH parcial) —
// quem chama monta o objeto certo pra cada ação (editar campos, ou só
// { ativo: true/false } pro toggle de ativar/desativar).
export async function atualizarWidget(token, id, dados) {
  return chamarApi(`/dashboard/widgets/${id}`, { token, metodo: 'PATCH', corpo: dados })
}

// Devolve a lista INTEIRA de widgets já reordenada (o backend troca a
// ordem com o vizinho e devolve tudo de novo) — quem chama só substitui o
// estado local pelo array recebido, sem precisar recalcular nada.
export async function moverWidget(token, id, direcao) {
  return chamarApi(`/dashboard/widgets/${id}/mover`, { token, metodo: 'PATCH', corpo: { direcao } })
}

export async function removerWidget(token, id) {
  await chamarApi(`/dashboard/widgets/${id}`, { token, metodo: 'DELETE' })
}
