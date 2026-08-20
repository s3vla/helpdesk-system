import { IconClock } from './icons'

// Indicador de "de quem é a vez de responder", visível na lista de chamados
// (Central de Chamados, Meus Chamados, Acompanhando) e no cabeçalho do
// painel de detalhe. Só existe enquanto o chamado está em andamento — o
// backend já garante `aguardandoRespostaDe: null` em qualquer outro status,
// então essa checagem aqui é só uma segunda camada, não a fonte da regra.
//
// O texto e a cor dependem de QUEM está olhando (`isIT`): quando o lado
// pendente é o do próprio observador, o tom é mais forte (é ação dele); do
// contrário é só informativo. Colaborador vendo seu próprio lado pendente
// usa uma frase deliberadamente neutra ("Você tem uma resposta pendente"),
// não uma cobrança — só o técnico ganha o destaque mais forte, porque
// responder o colaborador é literalmente o trabalho dele.
function AguardandoRespostaBadge({ status, aguardandoRespostaDe, isIT }) {
  if (status !== 'andamento' || !aguardandoRespostaDe) return null

  const ladoProprio = isIT ? 'TECNICO' : 'COLABORADOR'
  const ehLadoProprio = aguardandoRespostaDe === ladoProprio

  const texto = isIT
    ? (ehLadoProprio ? 'Aguardando sua resposta' : 'Aguardando resposta do colaborador')
    : (ehLadoProprio ? 'Você tem uma resposta pendente' : 'Aguardando resposta do técnico')

  // Só o técnico vendo o próprio lado pendente ganha o alerta mais forte —
  // é ação dele mesmo, faz sentido chamar mais atenção. Os outros três
  // casos usam o mesmo tom neutro (informativo, sem soar como cobrança).
  const alerta = isIT && ehLadoProprio
  const cor = alerta ? '#f59e0b' : '#94a3b8'
  const bg = alerta ? 'rgba(245,158,11,0.14)' : 'rgba(100,116,139,0.15)'
  const border = alerta ? 'rgba(245,158,11,0.3)' : 'rgba(100,116,139,0.25)'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: cor, border: `1px solid ${border}`, padding: '3px 10px 3px 8px', borderRadius: 99, fontSize: 12, fontWeight: alerta ? 700 : 600, fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap' }}>
      <IconClock width={12} height={12} />
      {texto}
    </span>
  )
}

export default AguardandoRespostaBadge
