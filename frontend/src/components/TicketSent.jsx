import { estilos } from '../styles/theme'

// Tela de confirmação exibida logo após o envio de um chamado.
function TicketSent({ onNew, onView }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '62vh', textAlign: 'center', padding: 20 }}>
      <div className="animate-check-pop" style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, fontSize: 40, color: '#22c55e' }}>
        ✓
      </div>
      <h2 className="animate-fade-up" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26, color: '#f0f4ff', margin: '0 0 10px' }}>Chamado enviado!</h2>
      <p className="animate-fade-up" style={{ color: '#7b92b4', fontSize: 15, margin: '0 0 36px', maxWidth: 380, lineHeight: 1.7 }}>
        Recebemos sua solicitação. O Time de TI irá analisar e entrar em contato em breve.
      </p>
      <div className="animate-fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onView} style={{ ...estilos.btnPrimary, width: 'auto' }}>Ver meus chamados</button>
        <button onClick={onNew} style={estilos.btnGhost}>Abrir outro chamado</button>
      </div>
    </div>
  )
}

export default TicketSent
