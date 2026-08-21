// Logo animado (dois círculos girando em sentidos opostos) usado no topo de
// todas as telas de login e nos layouts internos. `size` controla a escala
// inteira (texto incluso); `showText` esconde "NOVATECH AGRO" em telas estreitas.
//
// Cores ajustadas pro tema claro (fundo branco/cinza claro em todo o
// sistema agora) — SÓ a cor mudou, a animação (className="animate-spin-*")
// continua exatamente a mesma. O anel externo e o ponto central seguem
// #007851 (mesmo verde escuro usado nos botões de confirmação — já tinha
// contraste bom em qualquer fundo). O anel interno, que era #4ade80 (verde
// claro, pensado pra contrastar contra navy escuro), ficava apagado sobre
// fundo claro — trocado por #00B351, o verde médio já usado como accent em
// outros lugares do tema claro (authTheme.js), mantendo os dois anéis
// visualmente distintos entre si. O texto "NOVATECH" era quase branco
// (#f0f4ff, pensado pra fundo escuro) — trocado pro tom mais escuro da
// paleta clara (CORES_APP.tinta), senão ficaria ilegível sobre fundo claro.
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
          <circle cx={cx} cy={cx} r={cx * 0.56} fill="none" stroke="#00B351"
            strokeWidth={cx * 0.095} strokeDasharray={`${cx * 0.75} ${cx * 0.4}`} strokeLinecap="round" />
        </svg>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={cx} cy={cx} r={cx * 0.22} fill="#007851" />
        </svg>
      </div>
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '0.13em', color: '#10231F', fontSize: size * 0.47 }}>NOVATECH</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, letterSpacing: '0.3em', color: '#007851', fontSize: size * 0.23, marginTop: 2 }}>AGRO</div>
        </div>
      )}
    </div>
  )
}

export default Logo
