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

// Paleta clara do sistema INTEIRO — mesma paleta já aprovada e usada em
// authTheme.js pras 4 telas de login, reaproveitada aqui ao pé da letra
// (não é uma paleta nova) agora que o tema escuro foi aposentado em todo o
// resto do sistema também. `card`/`popover` são o mesmo branco — nomes
// diferentes só pra deixar claro a intenção de cada uso (superfície de
// conteúdo vs. menu/dropdown flutuante) nos componentes que os consomem.
export const CORES_APP = {
  fundo: '#F4F6F5',
  fundoCampo: '#EFF3F1',
  card: '#FFFFFF',
  popover: '#FFFFFF',
  // Tom mais escuro que `texto` — reservado pra título/heading de maior
  // destaque (h1/h2), mesma distinção que authTheme.js já fazia entre
  // `tinta` e `texto`.
  tinta: '#10231F',
  texto: '#3C4A46',
  textoFraco: '#5C6B67',
  textoSuave: '#7A8783',
  placeholder: '#9AA5A2',
  borda: '#D2DAD7',
  bordaSuave: '#E3E8E6',
  // Fundo de modal (ResolutionModal, ImageLightbox, TrocarSenhaModal
  // voluntário) — precisa continuar escurecendo o que está atrás mesmo
  // sobre uma página agora clara, então é um tom escuro translúcido (a cor
  // "tinta" da paleta em baixa opacidade), não branco.
  overlay: 'rgba(16,35,31,0.45)',
  erro: '#C0392B',
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