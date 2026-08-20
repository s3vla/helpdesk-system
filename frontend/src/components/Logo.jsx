// Logo animado (dois círculos girando em sentidos opostos) usado no topo de
// todas as telas de login e nos layouts internos. `size` controla a escala
// inteira (texto incluso); `showText` esconde "NOVATECH AGRO" em telas estreitas.
//
// Usa a variação ESCURA da marca (#007851) no anel giratório, no ponto
// central e no texto "AGRO" — não a clara (#007851): contra o fundo navy
// escuro, um traço fino em tom bem saturado lê como um halo/glow ao redor
// do símbolo, mesmo sem nenhum blur/box-shadow de verdade no CSS (feedback
// explícito: "remover qualquer glow ao redor do ícone da logo"). O anel
// interno (#4ade80) é outra cor, fora do escopo dessa marca — não mexe.
function Logo({ size = 44, showText = true }) {
  const cx = size / 2
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showText ? 12 : 0 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0 }}
          className="animate-spin-slow"
        >
          <circle cx={cx} cy={cx} r={cx * 0.87} fill="none" stroke="#007851"
            strokeWidth={cx * 0.11} strokeDasharray={`${cx * 1.25} ${cx * 0.55}`} strokeLinecap="round" />
        </svg>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ position: 'absolute', inset: 0 }}
          className="animate-spin-reverse"
        >
          <circle cx={cx} cy={cx} r={cx * 0.56} fill="none" stroke="#4ade80"
            strokeWidth={cx * 0.095} strokeDasharray={`${cx * 0.75} ${cx * 0.4}`} strokeLinecap="round" />
        </svg>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={cx} cy={cx} r={cx * 0.22} fill="#007851" />
        </svg>
      </div>
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '0.13em', color: '#f0f4ff', fontSize: size * 0.47 }}>NOVATECH</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, letterSpacing: '0.3em', color: '#007851', fontSize: size * 0.23, marginTop: 2 }}>AGRO</div>
        </div>
      )}
    </div>
  )
}

export default Logo
