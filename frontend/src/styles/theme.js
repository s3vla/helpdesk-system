// Paleta e estilos compartilhados extraídos do protótipo de referência
// (navy escuro + verde da marca). Centralizar aqui evita repetir os
// mesmos objetos de estilo em cada componente.

// parado/andamento mantêm as cores de status já validadas (cinza/âmbar),
// sem alteração. "finalizado" passou a usar a cor de destaque da marca
// (#00b351, Pantone 2257 C) em vez do verde solto de antes — pedido
// explícito, unificando "concluído" com a cor de identidade visual.
export const CORES_STATUS = {
  parado:     { bg: 'rgba(100,116,139,0.15)', fg: '#94a3b8', label: 'Parado',       dot: '#64748b' },
  andamento:  { bg: 'rgba(245,158,11,0.12)',  fg: '#f59e0b', label: 'Em andamento', dot: '#f59e0b' },
  finalizado: { bg: 'rgba(0,179,81,0.12)',    fg: '#00b351', label: 'Finalizado',   dot: '#00b351' },
}

export const CORES_PRIORIDADE = {
  baixa: { dot: '#22c55e', label: 'Baixa' },
  media: { dot: '#f59e0b', label: 'Média' },
  alta:  { dot: '#ef4444', label: 'Alta' },
}

// Objetos de estilo inline reutilizáveis (sem CSS-in-JS externo, só objetos JS
// passados via prop `style`, como pedido: CSS próprio, sem libs de UI).
export const estilos = {
  input: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,120,81,0.2)',
    borderRadius: 10, padding: '12px 14px', color: '#f0f4ff', fontSize: 15, outline: 'none',
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
    background: 'rgba(0,179,81,0.08)', color: '#00b351',
    border: '1px solid rgba(0,120,81,0.25)', borderRadius: 10,
    padding: '10px 20px', fontSize: 14, fontFamily: 'Outfit, sans-serif',
    fontWeight: 600, cursor: 'pointer',
  },
  label: {
    color: '#7b92b4', fontFamily: 'Outfit, sans-serif', fontSize: 11,
    letterSpacing: '0.09em', textTransform: 'uppercase',
    display: 'block', marginBottom: 7,
  },
  card: {
    background: '#0d1b34', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
  },
  sectionTitle: {
    fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26,
    color: '#f0f4ff', margin: '0 0 4px',
  },
}

export const IMAGEM_FUNDO_LOGIN = './public/nvtch.png'