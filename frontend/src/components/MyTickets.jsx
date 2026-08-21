import { useEffect, useState } from 'react'
import { estilos, CORES_STATUS, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { buscarMeusChamados } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import EstadoRequisicao from './EstadoRequisicao'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import { formatarData } from '../utils/formatters'
import { LABEL_CATEGORIA } from '../utils/categorias'
import { numeroChamado } from '../utils/numeroChamado'

const COLUNAS = [
  { status: 'parado', label: 'Parado', cor: CORES_STATUS.parado.dot },
  { status: 'andamento', label: 'Em andamento', cor: CORES_STATUS.andamento.dot },
  { status: 'finalizado', label: 'Finalizado', cor: CORES_STATUS.finalizado.dot },
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
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Meus chamados</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
          {carregando ? 'Carregando...' : `${chamados.length} chamado${chamados.length !== 1 ? 's' : ''} no total`}
        </p>
      </div>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        <div style={{ display: 'grid', gridTemplateColumns: largura < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {COLUNAS.map(coluna => {
            const cards = chamados.filter(c => c.status === coluna.status)
            return (
              <div key={coluna.status} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: CORES_APP.fundoCampo, borderRadius: 10, border: `1px solid ${coluna.cor}30` }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: coluna.cor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: coluna.cor }}>{coluna.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_APP.textoSuave }}>{cards.length}</span>
                </div>
                {cards.length === 0
                  ? <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13, border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>Nenhum chamado</div>
                  : cards.map(chamado => (
                    <div key={chamado.id} onClick={() => onSelect(chamado)}
                      style={{ ...estilos.card, borderLeft: `3px solid ${coluna.cor}`, padding: '14px 15px', cursor: 'pointer' }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: CORES_APP.tinta, marginBottom: 8, lineHeight: 1.4 }}>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, fontSize: 12, color: CORES_APP.textoSuave, marginRight: 6 }}>{numeroChamado(chamado.id)}</span>
                        {chamado.summary}
                      </div>
                      {chamado.status === 'andamento' && chamado.aguardandoRespostaDe && (
                        <div style={{ marginBottom: 8 }}>
                          <AguardandoRespostaBadge status={chamado.status} aguardandoRespostaDe={chamado.aguardandoRespostaDe} isIT={false} />
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category]}</span>
                        <span style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>{formatarData(chamado.created)}</span>
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
