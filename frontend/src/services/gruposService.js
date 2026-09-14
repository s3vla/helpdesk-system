// Camada de acesso a dados de Grupo — mesmo padrão de avisosService.js,
// chamarApi() em vez de fetch direto. Grupo é só organizacional por ora
// (ver comentário em Grupo entity no backend): listar, criar, adicionar e
// remover membro — nada funcional em cima disso ainda.
import { chamarApi } from './apiClient'
import { mapearUsuario } from './ticketService'

// Traduz `membros` (formato cru da API, nome/departamento em português)
// pro mesmo formato name/email/dept que o resto do front já usa pra
// usuário (ver mapearUsuario) — assim SolicitanteSelect e companhia dão
// pra reaproveitar sem tradução própria aqui.
function mapearGrupo(g) {
  return { id: g.id, nome: g.nome, membros: g.membros.map(mapearUsuario) }
}

export async function buscarGrupos(token) {
  const grupos = await chamarApi('/grupos', { token })
  return grupos.map(mapearGrupo)
}

export async function criarGrupo(token, nome) {
  const grupo = await chamarApi('/grupos', { token, metodo: 'POST', corpo: { nome } })
  return mapearGrupo(grupo)
}

export async function adicionarMembro(token, grupoId, usuarioId) {
  const grupo = await chamarApi(`/grupos/${grupoId}/membros`, { token, metodo: 'POST', corpo: { usuarioId } })
  return mapearGrupo(grupo)
}

export async function removerMembro(token, grupoId, usuarioId) {
  const grupo = await chamarApi(`/grupos/${grupoId}/membros/${usuarioId}`, { token, metodo: 'DELETE' })
  return mapearGrupo(grupo)
}
