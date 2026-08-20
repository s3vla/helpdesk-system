import { CORES_STATUS } from '../styles/theme'

function StatusBadge({ status }) {
  const c = CORES_STATUS[status]
  return (
    <span style={{ background: c.bg, color: c.fg, padding: '3px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

export default StatusBadge
