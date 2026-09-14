// Camada de acesso a dados de Setor/Mapeamento de e-mail — mesmo padrão de
// avisosService.js, chamarApi() em vez de fetch direto.
import { chamarApi } from './apiClient'

// SEM token — endpoint público, chamado pela tela de Primeiro Acesso antes
// de existir qualquer sessão (ver SetoresController.sugerir no backend).
// Retorna { setor: { id, nome } | null }.
export async function sugerirSetorPorEmail(email) {
  const params = new URLSearchParams({ email })
  return chamarApi(`/setores/sugerir?${params.toString()}`)
}

export async function buscarSetores(token) {
  return chamarApi('/setores', { token })
}

export async function criarSetor(token, nome) {
  return chamarApi('/setores', { token, metodo: 'POST', corpo: { nome } })
}

export async function buscarMapeamentos(token) {
  return chamarApi('/setores/mapeamentos', { token })
}

export async function criarMapeamento(token, { prefixoEmail, setorId }) {
  return chamarApi('/setores/mapeamentos', {
    token,
    metodo: 'POST',
    corpo: { prefixoEmail, setorId },
  })
}

export async function atualizarMapeamento(token, id, setorId) {
  return chamarApi(`/setores/mapeamentos/${id}`, {
    token,
    metodo: 'PATCH',
    corpo: { setorId },
  })
}
