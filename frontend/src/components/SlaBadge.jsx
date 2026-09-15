import { IconClock } from './icons'
import { CORES_PRIORIDADE } from '../styles/theme'

// Indicador de SLA de resposta — some sozinho quando `situacao === 'ok'`
// (ver calcularSituacaoSla em utils/slaConfig.js). Mesmo padrão visual de
// AguardandoRespostaBadge.jsx (pílula, ícone, texto), só com paleta própria
// (vermelho/âmbar) porque sinaliza um alerta operacional, não "de quem é a
// vez de responder".
function SlaBadge({ situacao }) {
  if (situacao === 'ok') return null

  const estourado = situacao === 'estourado'
  const cor = estourado ? CORES_PRIORIDADE.alta.fg : '#B45309'
  const bg = estourado ? CORES_PRIORIDADE.alta.bg : 'rgba(245,158,11,0.12)'
  const border = estourado ? CORES_PRIORIDADE.alta.borda : 'rgba(245,158,11,0.3)'
  const texto = estourado ? 'Prazo estourado' : 'Prazo em risco'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: cor, border: `1px solid ${border}`, padding: '3px 10px 3px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
      <IconClock width={12} height={12} />
      {texto}
    </span>
  )
}

export default SlaBadge
