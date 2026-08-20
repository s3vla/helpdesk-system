// Lista fechada de e-mails autorizados a ter conta no sistema — é o ÚNICO
// lugar do código que define "quem pode entrar". Esses e-mails são
// vinculados ao CARGO (não à pessoa): quando alguém troca de função ou sai
// da empresa, o e-mail correspondente continua nesta lista e passa a
// pertencer a quem assumir aquele cargo.
//
// Pra adicionar ou remover alguém, mexa só aqui — nenhum outro arquivo
// deveria conter e-mails "hardcoded" de autorização.

// Só estes dois e-mails podem logar na Área Técnica. Diferente dos
// colaboradores, técnicos não têm Primeiro Acesso (são criados via seed —
// ver src/database/seed.service.ts, que valida contra esta mesma lista).
export const EMAILS_TECNICO_AUTORIZADOS = [
  'suporte@novatechagro.com.br',
  'ti@novatechagro.com.br',
];

export const EMAILS_COLABORADOR_AUTORIZADOS = [
  'rh@novatechagro.com.br',
  'credito@novatechagro.com.br',
  'financeiro@novatechagro.com.br',
  'faturamento@novatechagro.com.br',
  'faturamento02@novatechagro.com.br',
  'faturamento03@novatechagro.com.br',
  'controladoria@novatechagro.com.br',
  'qualidade@novatechagro.com.br',
  'qualidade02@novatechagro.com.br',
  'qualidade03@novatechagro.com.br',
  'contabil@novatechagro.com.br',
  'marketing@novatechagro.com.br',
  'fiscal@novatechagro.com.br',
  'deposito@novatechagro.com.br',
  'logistica@novatechagro.com.br',
  'sandro.huber@novatechagro.com.br',
  'recepcao@novatechagro.com.br',
  'fabrica@novatechagro.com.br',
];

export function emailColaboradorAutorizado(email: string): boolean {
  return EMAILS_COLABORADOR_AUTORIZADOS.includes(email.toLowerCase());
}

export function emailTecnicoAutorizado(email: string): boolean {
  return EMAILS_TECNICO_AUTORIZADOS.includes(email.toLowerCase());
}
