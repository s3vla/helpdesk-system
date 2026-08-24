// Deriva o departamento automaticamente a partir do prefixo do e-mail
// corporativo (a parte antes do @) — usado no Primeiro Acesso pra
// pré-preencher e travar o campo Departamento, sem perguntar de novo algo
// que já dá pra saber pelo próprio e-mail. Centralizado aqui (não
// espalhado no componente) pra ficar fácil de ajustar se a lista de
// e-mails autorizados mudar — mas repare que a FONTE DA VERDADE de quais
// e-mails existem continua sendo EMAILS_COLABORADOR_AUTORIZADOS no
// backend (src/config/emails-autorizados.ts); este arquivo só decide o
// RÓTULO de departamento pra cada um, é puramente de apresentação.
const DEPARTAMENTO_POR_PREFIXO = {
  rh: 'RH',
  credito: 'Crédito',
  financeiro: 'Financeiro',
  faturamento: 'Faturamento',
  faturamento02: 'Faturamento',
  faturamento03: 'Faturamento',
  controladoria: 'Controladoria',
  qualidade: 'Qualidade',
  qualidade02: 'Qualidade',
  qualidade03: 'Qualidade',
  contabil: 'Contábil',
  marketing: 'Marketing',
  fiscal: 'Fiscal',
  deposito: 'Depósito',
  logistica: 'Logística',
  recepcao: 'Recepção',
  fabrica: 'Fábrica',
  // "sandro.huber" é e-mail de uma pessoa, não de um cargo/setor — de
  // propósito sem entrada aqui, cai no `null` abaixo e o campo Departamento
  // fica editável em vez de travado (mesmo tratamento de qualquer prefixo
  // futuro que apareça na lista de autorizados sem estar mapeado aqui
  // ainda — nunca trava um campo com um rótulo errado ou vazio).
}

// Retorna o departamento pro prefixo do e-mail informado, ou `null` se não
// houver mapeamento — quem usa isso decide, nesse caso, deixar o campo
// editável em vez de travado.
export function departamentoPorEmail(email) {
  const prefixo = email.trim().toLowerCase().split('@')[0]
  return DEPARTAMENTO_POR_PREFIXO[prefixo] ?? null
}
