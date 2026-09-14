// Mesma lista de domínios aceitos pelo backend (ver DOMINIOS_EMAIL_AUTORIZADOS
// em backend/src/config/emails-autorizados.ts) — duplicada aqui de
// propósito: quem de fato decide se um domínio/e-mail é aceito é sempre o
// backend (ValidationPipe rejeita com 400 antes de qualquer outra coisa);
// esta checagem no frontend só existe pra dar feedback imediato, sem
// esperar o round-trip da API pra um erro óbvio de domínio digitado errado.
export const DOMINIOS_EMAIL_AUTORIZADOS = [
  'novatechagro.com.br',
  'alvotech.com.br',
]

export function emailComDominioAutorizado(email) {
  const dominio = email.trim().toLowerCase().split('@')[1]
  return DOMINIOS_EMAIL_AUTORIZADOS.includes(dominio)
}

// Mensagem de erro compartilhada entre LoginScreen e FirstAccessModal —
// mesmo texto nos dois lugares, montado a partir da lista em vez de
// hardcoded, pra nunca ficar dessincronizado se um domínio novo for
// adicionado aqui.
export const MENSAGEM_DOMINIO_INVALIDO = `Use seu e-mail corporativo (${DOMINIOS_EMAIL_AUTORIZADOS.map((d) => `@${d}`).join(' ou ')})`
