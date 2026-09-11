// Paleta e estilos compartilhados extraídos do protótipo de referência
// (navy escuro + verde da marca). Centralizar aqui evita repetir os
// mesmos objetos de estilo em cada componente.

// Fonte ÚNICA das cores de status/prioridade — ITDashboard.jsx, MyTickets.jsx
// e CreateTicket.jsx importam daqui em vez de manter cópias próprias (tinham
// 3 cópias divergentes antes; "finalizado" chegou a ser #00b351 num lugar e
// #22c55e em outros dois ao mesmo tempo — bug corrigido ao consolidar).
//
// "andamento" continua âmbar de propósito (decisão explícita: não trocar
// para azul, mesmo a referência de design sugerindo — já ajustamos essa
// paleta várias vezes e uma mudança de cor de status é sensível).
//
// `label` é só o RÓTULO VISUAL ("Na fila"/"Resolvido") — os valores internos
// do enum (parado/andamento/finalizado, chave deste objeto) não mudam em
// lugar nenhum: DTO, backend, comparações no código (`status === 'parado'`)
// continuam exatamente como sempre foram. Central de Chamados, TicketPanel
// e qualquer outro lugar que usa StatusBadge herdam o rótulo novo juntos,
// pra não ter duas telas chamando o mesmo status de nomes diferentes.
export const CORES_STATUS = {
  parado:     { bg: 'rgba(138,150,163,0.15)', fg: '#8A96A3', label: 'Na fila',       dot: '#8A96A3' },
  andamento:  { bg: 'rgba(245,158,11,0.12)',  fg: '#f59e0b', label: 'Em atendimento', dot: '#f59e0b' },
  finalizado: { bg: 'rgba(0,120,81,0.14)',    fg: '#007851', label: 'Resolvido',      dot: '#007851' },
}

// "alta" ganhou tratamento de pílula com fundo (mesma linguagem visual do
// StatusBadge) — dá mais destaque justamente ao caso que mais importa.
// baixa/media continuam só com o ponto colorido, sem mudança de cor.
export const CORES_PRIORIDADE = {
  baixa: { dot: '#22c55e', label: 'Baixa' },
  media: { dot: '#f59e0b', label: 'Média' },
  alta:  { dot: '#ef4444', label: 'Alta', fg: '#B3402F', bg: '#FBEDEA', borda: '#F2D8D2' },
}

// Accent de navegação/filtro exclusivo da área de TI (azul = TI, verde =
// ação de confirmação do colaborador — regra de cor já aprovada). O lado
// colaborador (EmployeeLayout, MyTickets, CreateTicket) continua verde, sem
// nenhuma mudança — só ITLayout/ITDashboard passam a usar isto.
export const CORES_TI = {
  accent: '#0049C0',
  accentBg: '#EEF3FC',
  accentBorda: '#CFDDF7',
}

// Fonte ÚNICA da cor/rótulo de cada tipo de aviso do Mural — usada tanto
// no badge do card (MuralAvisos.jsx) quanto nos botões de seleção do
// formulário (PublicarAvisoModal.jsx), pra nunca divergir entre as duas
// telas (o mesmo aviso "Alerta" precisa ser a MESMA cor nos dois lugares).
// Reaproveita paletas já aprovadas em vez de inventar cor nova: azul =
// mesmo accent da área técnica (CORES_TI), vermelho = mesmo tom de
// prioridade alta (CORES_PRIORIDADE.alta), âmbar = mesmo tom já usado pro
// status "Em atendimento" (CORES_STATUS.andamento).
export const CORES_TIPO_AVISO = {
  INFORMATIVO: { bg: CORES_TI.accentBg, fg: CORES_TI.accent, borda: CORES_TI.accentBorda, label: 'Informativo' },
  ALERTA: { bg: CORES_PRIORIDADE.alta.bg, fg: CORES_PRIORIDADE.alta.fg, borda: CORES_PRIORIDADE.alta.borda, label: 'Alerta' },
  MANUTENCAO: { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', borda: 'rgba(245,158,11,0.3)', label: 'Manutenção' },
}

// Fonte ÚNICA da cor/rótulo de cada status de sugestão do Fórum — usada
// tanto no badge do card (ForumSugestoes.jsx) quanto no seletor da tela de
// detalhe (ForumDetalheSugestao.jsx). Reaproveita paletas já aprovadas em
// vez de inventar cor nova: cinza = mesmo tom de CORES_STATUS.parado
// ("aguardando"), azul = accent da área técnica, verde = mesmo tom de
// "Resolvido"/ação positiva, vermelho = mesmo tom de prioridade alta.
export const CORES_STATUS_SUGESTAO = {
  ABERTA: { bg: CORES_STATUS.parado.bg, fg: CORES_STATUS.parado.fg, borda: 'rgba(138,150,163,0.35)', label: 'Aberta' },
  EM_ANALISE: { bg: CORES_TI.accentBg, fg: CORES_TI.accent, borda: CORES_TI.accentBorda, label: 'Em análise' },
  IMPLEMENTADA: { bg: CORES_STATUS.finalizado.bg, fg: CORES_STATUS.finalizado.fg, borda: 'rgba(0,120,81,0.3)', label: 'Implementada' },
  RECUSADA: { bg: CORES_PRIORIDADE.alta.bg, fg: CORES_PRIORIDADE.alta.fg, borda: CORES_PRIORIDADE.alta.borda, label: 'Recusada' },
}

// Tokens de fundo/texto do sistema INTEIRO (pós-login — as telas de auth
// continuam fixas no tema claro de authTheme.js, ver LoginScreen.jsx),
// estruturados por modo. TEMA_CLARO é a mesma paleta já aprovada e usada em
// authTheme.js. TEMA_ESCURO é uma paleta NOVA (não existe mais histórico de
// Git neste projeto pra recuperar os valores antigos) — mesma família de
// cinza-esverdeado da paleta clara (ecoa `tinta`/#10231F), só invertida em
// luminosidade, pra manter a mesma "personalidade" visual da marca.
// Chaves em kebab-case: cada uma vira a variável CSS `--app-<chave>`
// (ver ThemeProvider), então os nomes aqui são a fonte da verdade — não
// duplicar esses valores em nenhum outro arquivo (index.css inclusive).
export const TEMA_CLARO = {
  fundo: '#F4F6F5',
  'fundo-campo': '#EFF3F1',
  card: '#FFFFFF',
  popover: '#FFFFFF',
  tinta: '#10231F',
  texto: '#3C4A46',
  'texto-fraco': '#5C6B67',
  'texto-suave': '#7A8783',
  placeholder: '#9AA5A2',
  borda: '#D2DAD7',
  'borda-suave': '#E3E8E6',
  overlay: 'rgba(16,35,31,0.45)',
  erro: '#C0392B',
}

export const TEMA_ESCURO = {
  fundo: '#0F1613',
  'fundo-campo': '#17211D',
  card: '#1A2622',
  popover: '#22312B',
  tinta: '#F4F7F5',
  texto: '#D7E0DC',
  'texto-fraco': '#A9B6B1',
  'texto-suave': '#7E8C87',
  placeholder: '#5B6863',
  borda: '#2C3A35',
  'borda-suave': '#22302B',
  // Overlay de modal precisa continuar escurecendo o que está atrás mesmo
  // com a página já escura — usa um tom quase preto (não a `tinta` deste
  // modo, que agora é clara) em opacidade mais alta que no claro.
  overlay: 'rgba(4,10,8,0.6)',
  erro: '#E5584A',
}

// CORES_APP nunca muda de valor em si — cada campo é uma referência a uma
// variável CSS (funciona em qualquer `style` inline, mesmo sem CSS-in-JS).
// Quem muda é o VALOR da variável, escrito no elemento raiz pelo
// ThemeProvider (context/ThemeContext.jsx) sempre que o modo alterna. Isso
// evita reescrever os ~20 componentes que já importam CORES_APP direto.
// `card`/`popover` continuam nomes diferentes só pra deixar clara a
// intenção de cada uso (superfície de conteúdo vs. menu/dropdown
// flutuante) nos componentes que os consomem, mesmo hoje sendo o mesmo
// branco no tema claro.
export const CORES_APP = {
  fundo: 'var(--app-fundo)',
  fundoCampo: 'var(--app-fundo-campo)',
  card: 'var(--app-card)',
  popover: 'var(--app-popover)',
  // Tom mais contrastante que `texto` — reservado pra título/heading de
  // maior destaque (h1/h2), mesma distinção que authTheme.js já fazia
  // entre `tinta` e `texto`.
  tinta: 'var(--app-tinta)',
  texto: 'var(--app-texto)',
  textoFraco: 'var(--app-texto-fraco)',
  textoSuave: 'var(--app-texto-suave)',
  placeholder: 'var(--app-placeholder)',
  borda: 'var(--app-borda)',
  bordaSuave: 'var(--app-borda-suave)',
  overlay: 'var(--app-overlay)',
  erro: 'var(--app-erro)',
}

// Objetos de estilo inline reutilizáveis (sem CSS-in-JS externo, só objetos JS
// passados via prop `style`, como pedido: CSS próprio, sem libs de UI).
export const estilos = {
  input: {
    width: '100%', background: CORES_APP.card, border: `1px solid ${CORES_APP.borda}`,
    borderRadius: 10, padding: '12px 14px', color: CORES_APP.texto, fontSize: 15, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  btnPrimary: {
    // Área grande e sólida = usa a variação ESCURA (6154C) — o tom claro
    // (2257C) fica reservado pra elementos pequenos (ícone, badge, link,
    // borda fina de campo focado); num preenchimento grande, a mesma cor
    // exata "grita" muito mais do que num traço fino. Ver mesmo raciocínio
    // em Logo.jsx e nos avatares circulares.
    background: '#007851',
    color: '#fff', border: 'none', borderRadius: 10, padding: '13px 28px',
    fontSize: 15, fontFamily: 'Outfit, sans-serif', fontWeight: 700,
    letterSpacing: '0.04em', cursor: 'pointer', width: '100%',
  },
  btnGhost: {
    background: 'rgba(0,120,81,0.08)', color: '#007851',
    border: '1px solid rgba(0,120,81,0.25)', borderRadius: 10,
    padding: '10px 20px', fontSize: 14, fontFamily: 'Outfit, sans-serif',
    fontWeight: 600, cursor: 'pointer',
  },
  label: {
    color: CORES_APP.textoFraco, fontFamily: 'Outfit, sans-serif', fontSize: 11,
    letterSpacing: '0.09em', textTransform: 'uppercase',
    display: 'block', marginBottom: 7,
  },
  card: {
    background: CORES_APP.card, border: `1px solid ${CORES_APP.borda}`, borderRadius: 14,
  },
  sectionTitle: {
    fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26,
    color: CORES_APP.texto, margin: '0 0 4px',
  },
}

export const IMAGEM_FUNDO_LOGIN = './public/nvtch.png'