// Camada de acesso a dados do Mural de Avisos — mesmo padrão de
// dashboardService.js, chamarApi() em vez de fetch direto.
import { chamarApi } from './apiClient'

// `incluirExpirados`: só tem efeito de verdade quando quem pede é TECNICO
// (o backend ignora em silêncio pra colaborador) — ver AvisosService.listar.
// Resposta já vem paginada ({ itens, total, pagina, totalPaginas }) — os
// itens não passam por nenhum "mapear" próprio (diferente de chamados/
// usuários), MuralAvisos.jsx já consome o formato cru da API direto.
export async function buscarAvisos(token, { incluirExpirados = false, pagina = 1 } = {}) {
  const params = new URLSearchParams()
  if (incluirExpirados) params.set('incluirExpirados', 'true')
  params.set('pagina', pagina)
  return chamarApi(`/avisos?${params.toString()}`, { token })
}

export async function buscarContagemNaoLidos(token) {
  const resposta = await chamarApi('/avisos/nao-lidos/contagem', { token })
  return resposta.total
}

// `dados`: { titulo, mensagem, tipo, fixado?, expiraEm? } — `expiraEm`, se
// presente, é a string CRUA de <input type="datetime-local"> ("YYYY-MM-
// DDTHH:mm", sem "Z"/timezone) — nunca convertida via toISOString() aqui,
// pra não desalinhar do horário local que o técnico escolheu (mesmo cuidado
// já tomado em periodoPadrao.js/ChamadosService.resolverPeriodo).
export async function criarAviso(token, dados) {
  return chamarApi('/avisos', { token, metodo: 'POST', corpo: dados })
}

export async function atualizarAviso(token, id, dados) {
  return chamarApi(`/avisos/${id}`, { token, metodo: 'PATCH', corpo: dados })
}

export async function removerAviso(token, id) {
  await chamarApi(`/avisos/${id}`, { token, metodo: 'DELETE' })
}

export async function marcarAvisoLido(token, id) {
  await chamarApi(`/avisos/${id}/marcar-lido`, { token, metodo: 'POST' })
}

// TECNICO-only no backend (RolesGuard) — lista de quem já leu, mais antigo
// primeiro.
export async function buscarLeitoresAviso(token, id) {
  return chamarApi(`/avisos/${id}/leitores`, { token })
}
