// Camada de acesso a dados dos relatórios de "Atividade" em Administração
// — mesmo padrão de dashboardService.js, chamarApi() em vez de fetch
// direto. Datas vêm cruas da API (string ISO) — quem exibe converte com
// `new Date(...)` e formatarDataHora/tempoDecorrido (utils/formatters.js).
import { chamarApi } from './apiClient'

export async function buscarRelatorioAcesso(token, { diasInatividade } = {}) {
  const params = new URLSearchParams()
  if (diasInatividade) params.set('diasInatividade', diasInatividade)
  const query = params.toString()
  return chamarApi(`/admin/relatorios/acesso${query ? `?${query}` : ''}`, { token })
}

export async function buscarRelatorioAtividadeChamados(token, { dataInicio, dataFim } = {}) {
  const params = new URLSearchParams()
  if (dataInicio) params.set('dataInicio', dataInicio)
  if (dataFim) params.set('dataFim', dataFim)
  const query = params.toString()
  return chamarApi(`/admin/relatorios/atividade-chamados${query ? `?${query}` : ''}`, { token })
}

export async function buscarRelatorioTempoAtendimento(token, { dataInicio, dataFim } = {}) {
  const params = new URLSearchParams()
  if (dataInicio) params.set('dataInicio', dataInicio)
  if (dataFim) params.set('dataFim', dataFim)
  const query = params.toString()
  return chamarApi(`/admin/relatorios/tempo-atendimento${query ? `?${query}` : ''}`, { token })
}
