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
  deposito02: 'Depósito',
  logistica: 'Logística',
  recepcao: 'Recepção',
  fabrica: 'Fábrica',
  comercial: 'Comercial',
  // "scapini" e "fabiom" são e-mails de pessoa (diretores), não de
  // cargo/setor — mas diferente de antes, agora têm departamento travado
  // mesmo assim, por decisão explícita (os dois vão sempre para
  // "Diretoria", não ficam com o campo editável).
  scapini: 'Diretoria',
  fabiom: 'Diretoria',
  // "sandro.huber" deixou de ser exceção editável — travado como
  // "Gerência" agora, mesmo tratamento de qualquer outro prefixo mapeado
  // aqui (antes não tinha entrada nesta lista, então caía no `null` abaixo
  // e o campo Departamento ficava editável; comportamento mudou de
  // propósito).
  'sandro.huber': 'Gerência',
  // Prefixo, não domínio: "financeiro" aqui já cobre tanto
  // financeiro@novatechagro.com.br quanto financeiro@alvotech.com.br
  // (departamentoPorEmail só olha a parte antes do @, ver função abaixo) —
  // nenhuma entrada nova precisa ser adicionada só por causa do domínio.
  //
  // Qualquer prefixo futuro que apareça na lista de autorizados sem estar
  // mapeado aqui ainda cai no `null` abaixo, e o campo Departamento fica
  // editável em vez de travado — nunca trava um campo com um rótulo errado
  // ou vazio.
}

// Retorna o departamento pro prefixo do e-mail informado, ou `null` se não
// houver mapeamento — quem usa isso decide, nesse caso, deixar o campo
// editável em vez de travado.
export function departamentoPorEmail(email) {
  const prefixo = email.trim().toLowerCase().split('@')[0]
  return DEPARTAMENTO_POR_PREFIXO[prefixo] ?? null
}
