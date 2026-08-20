import { CORES_PRIORIDADE } from '../styles/theme'

function PriorityChip({ priority }) {
  const c = CORES_PRIORIDADE[priority]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: c.dot, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

export default PriorityChip
