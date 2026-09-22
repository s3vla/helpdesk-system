// Lista fechada de e-mails autorizados a ter conta no sistema. Esses
// e-mails são vinculados ao CARGO (não à pessoa): quando alguém troca de
// função ou sai da empresa, o e-mail correspondente continua na lista e
// passa a pertencer a quem assumir aquele cargo.
//
// EMAILS_COLABORADOR_AUTORIZADOS/EMAILS_TECNICO_AUTORIZADOS vêm de
// variável de ambiente (lista separada por vírgula, mesmo padrão de
// CORS_ORIGIN em main.ts) — não hardcoded. Mudar quem está autorizado
// passa a ser só trocar a variável no ambiente do servidor e reiniciar o
// serviço, sem precisar de um novo deploy de código. `import
// 'dotenv/config'` no topo garante que process.env já esteja populado a
// partir do .env mesmo se este módulo for importado ANTES do
// ConfigModule do Nest processar o .env — imports sempre resolvem antes
// do corpo do módulo que importa rodar (ex: email-corporativo.decorator.ts
// usa DOMINIOS_EMAIL_AUTORIZADOS pra montar um regex no momento da
// importação, fora de qualquer classe). dotenv.config() é seguro de
// chamar de novo aqui mesmo que o ConfigModule já tenha rodado (não
// sobrescreve variável já definida) e não falha se não existir arquivo
// .env (caso de produção, onde as variáveis já vêm do próprio processo).
import 'dotenv/config';

// Lê uma variável de ambiente como lista separada por vírgula, ou lança
// um erro claro na hora em que este módulo é avaliado — falha alto e
// cedo, na inicialização, em vez de deixar a lista vazia em silêncio
// (cenário "o sistema subiu mas ninguém consegue logar, sem log nenhum
// explicando por quê").
function exigirListaDeEmails(nomeVariavel: string): string[] {
  const bruto = process.env[nomeVariavel];
  const lista = (bruto ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (lista.length === 0) {
    throw new Error(
      `Variável ${nomeVariavel} não configurada — defina no .env (dev) ou ` +
        `nas variáveis de ambiente do serviço (produção), uma lista de ` +
        `e-mails separada por vírgula. Ver .env.example.`,
    );
  }
  return lista;
}

// Domínios de e-mail corporativo aceitos — usado por EmailCorporativo()
// (validators/email-corporativo.decorator.ts) pra montar a regra de
// formato. Estar aqui não autoriza ninguém sozinho: só decide se o FORMATO
// do e-mail passa a validação; quem de fato pode logar continua sendo só
// quem está literalmente nas listas abaixo.
export const DOMINIOS_EMAIL_AUTORIZADOS = ['empresa-exemplo.com'];

// Só estes e-mails podem logar na Área Técnica. Diferente dos
// colaboradores, técnicos não têm Primeiro Acesso (são criados via seed —
// ver src/database/seed.service.ts, que valida contra esta mesma lista).
export const EMAILS_TECNICO_AUTORIZADOS = exigirListaDeEmails(
  'EMAILS_TECNICO_AUTORIZADOS',
);

export const EMAILS_COLABORADOR_AUTORIZADOS = exigirListaDeEmails(
  'EMAILS_COLABORADOR_AUTORIZADOS',
);

export function emailColaboradorAutorizado(email: string): boolean {
  return EMAILS_COLABORADOR_AUTORIZADOS.includes(email.toLowerCase());
}

export function emailTecnicoAutorizado(email: string): boolean {
  return EMAILS_TECNICO_AUTORIZADOS.includes(email.toLowerCase());
}
