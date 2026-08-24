// Logo animado (dois círculos girando em sentidos opostos) usado no topo de
// todas as telas de login e nos layouts internos. `size` controla a escala
// inteira (texto incluso); `showText` esconde "NOVATECH AGRO" em telas estreitas.
//
import { CORES_APP } from '../styles/theme'

// O anel externo e o ponto central seguem #007851 (mesmo verde escuro usado
// nos botões de confirmação — já tem contraste bom em qualquer fundo,
// claro ou escuro). O anel interno usa #00B351, o verde médio já usado
// como accent em outros lugares do tema (authTheme.js), mantendo os dois
// anéis visualmente distintos entre si. O texto "NOVATECH" usa
// CORES_APP.tinta (não um hex fixo) justamente pra acompanhar o tema
// ativo — travado em `tinta`, ficaria ilegível assim que o tema escuro
// entrasse (mesmo tom escuro sobre fundo de card também escuro).
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
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '0.13em', color: CORES_APP.tinta, fontSize: size * 0.47 }}>NOVATECH</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, letterSpacing: '0.3em', color: '#007851', fontSize: size * 0.23, marginTop: 2 }}>AGRO</div>
        </div>
      )}
    </div>
  )
}

export default Logo
