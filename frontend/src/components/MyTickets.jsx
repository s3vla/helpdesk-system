import { useEffect, useState } from 'react'
import { estilos } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { buscarMeusChamados } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import EstadoRequisicao from './EstadoRequisicao'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import { formatarData } from '../utils/formatters'
import { LABEL_CATEGORIA } from '../utils/categorias'

const COLUNAS = [
  { status: 'parado', label: 'Parado', cor: '#64748b' },
  { status: 'andamento', label: 'Em andamento', cor: '#f59e0b' },
  { status: 'finalizado', label: 'Finalizado', cor: '#22c55e' },
]

// Kanban "Meus Chamados": busca os chamados do colaborador logado
// (GET /chamados/meus já filtra pelo usuário do token, nunca mostra
// chamados de outra pessoa) e agrupa por status em 3 colunas.
// `versaoDados` é incrementado pelo App.jsx toda vez que o TicketPanel muda
// algo (status, comentário) — é o gatilho pra essa lista buscar de novo.
function MyTickets({ versaoDados, onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      setChamados(await buscarMeusChamados(token))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoDados])

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: '#f0f4ff', margin: '0 0 6px' }}>Meus chamados</h1>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0 }}>
          {carregando ? 'Carregando...' : `${chamados.length} chamado${chamados.length !== 1 ? 's' : ''} no total`}
        </p>
      </div>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        <div style={{ display: 'grid', gridTemplateColumns: largura < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {COLUNAS.map(coluna => {
            const cards = chamados.filter(c => c.status === coluna.status)
            return (
              <div key={coluna.status} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#0d1b34', borderRadius: 10, border: `1px solid ${coluna.cor}30` }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: coluna.cor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: coluna.cor }}>{coluna.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: '#4a5f7a' }}>{cards.length}</span>
                </div>
                {cards.length === 0
                  ? <div style={{ padding: '22px 14px', textAlign: 'center', color: '#2a3a4e', fontSize: 13, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 10 }}>Nenhum chamado</div>
                  : cards.map(chamado => (
                    <div key={chamado.id} onClick={() => onSelect(chamado)}
                      style={{ ...estilos.card, borderLeft: `3px solid ${coluna.cor}`, padding: '14px 15px', cursor: 'pointer' }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: '#f0f4ff', marginBottom: 8, lineHeight: 1.4 }}>{chamado.summary}</div>
                      {chamado.status === 'andamento' && chamado.aguardandoRespostaDe && (
                        <div style={{ marginBottom: 8 }}>
                          <AguardandoRespostaBadge status={chamado.status} aguardandoRespostaDe={chamado.aguardandoRespostaDe} isIT={false} />
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: 'rgba(255,255,255,0.06)', color: '#7b92b4', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category]}</span>
                        <span style={{ color: '#4a5f7a', fontSize: 11 }}>{formatarData(chamado.created)}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )
          })}
        </div>
      </EstadoRequisicao>
    </div>
  )
}

export default MyTickets
