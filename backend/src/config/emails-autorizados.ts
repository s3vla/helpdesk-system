// Lista fechada de e-mails autorizados a ter conta no sistema — é o ÚNICO
// lugar do código que define "quem pode entrar". Esses e-mails são
// vinculados ao CARGO (não à pessoa): quando alguém troca de função ou sai
// da empresa, o e-mail correspondente continua nesta lista e passa a
// pertencer a quem assumir aquele cargo.
//
// Pra adicionar ou remover alguém, mexa só aqui — nenhum outro arquivo
// deveria conter e-mails "hardcoded" de autorização.
//
// Decisão deliberada: isso é código, não variável de ambiente — mudar
// quem está autorizado exige editar este arquivo e fazer um novo deploy,
// nunca só trocar algo no .env do servidor (ver README, seção "Quem pode
// logar").

// Domínios de e-mail corporativo aceitos — usado por EmailCorporativo()
// (validators/email-corporativo.decorator.ts) pra montar a regra de
// formato. Estar aqui não autoriza ninguém sozinho: só decide se o FORMATO
// do e-mail passa a validação; quem de fato pode logar continua sendo só
// quem está literalmente nas listas abaixo.
export const DOMINIOS_EMAIL_AUTORIZADOS = [
  'novatechagro.com.br',
  'alvotechagro.com.br',
];

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
  'comercial@novatechagro.com.br',
  'scapini@novatechagro.com.br',
  'fabiom@novatechagro.com.br',
  // Financeiro de outro domínio/empresa (Alvotech Agro) — pessoa/setor
  // diferente do financeiro@novatechagro.com.br já existente acima, os
  // dois coexistem.
  'financeiro@alvotechagro.com.br',
];

export function emailColaboradorAutorizado(email: string): boolean {
  return EMAILS_COLABORADOR_AUTORIZADOS.includes(email.toLowerCase());
}

export function emailTecnicoAutorizado(email: string): boolean {
  return EMAILS_TECNICO_AUTORIZADOS.includes(email.toLowerCase());
}
