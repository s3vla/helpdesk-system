// Converte um erro da API num texto simples, sem jargão técnico, pra
// mostrar direto na tela pro colaborador (que não tem por que saber o que
// é um "500" ou um "403"). Mensagens de validação (400/409) já vêm em
// português direto do backend (ver DTOs da API) — essas passam direto.
export function traduzirErroApi(erro) {
  const status = erro?.status

  if (status === 0) return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
  if (status === 404) return 'Não encontramos o que você procurava.'
  if (status === 429) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
  if (typeof status === 'number' && status >= 500) return 'Algo deu errado do nosso lado. Tente novamente em instantes.'

  // 400/401/403/409 e afins: a mensagem do backend já é escrita em
  // português comum (ver os DTOs e Unauthorized/Forbidden/ConflictException
  // da API), então é segura de mostrar direto — inclui "e-mail ou senha
  // inválidos", "e-mail não autorizado" etc. Um 401 de SESSÃO EXPIRADA (não
  // de login que falhou) nunca chega até aqui: o AuthContext intercepta
  // esse caso antes (só existe "sessão" pra expirar se já havia um token —
  // ver tratarErroApi), então qualquer 401 que sobra pra esta função é
  // sempre uma tentativa de login com credencial errada.
  return erro?.message || 'Não foi possível concluir a ação. Tente novamente.'
}
