import { CORES_PRIORIDADE } from '../styles/theme'

// "alta" vira pílula com fundo tintado (mesma linguagem do StatusBadge) —
// baixa/media continuam só como ponto colorido, sem mudança visual.
function PriorityChip({ priority }) {
  const c = CORES_PRIORIDADE[priority]

  if (priority === 'alta') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 11px', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif', color: c.fg, background: c.bg, border: `1px solid ${c.borda}`, borderRadius: 99, whiteSpace: 'nowrap' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.fg, display: 'inline-block', flexShrink: 0 }} />
        {c.label}
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: c.dot, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

export default PriorityChip
