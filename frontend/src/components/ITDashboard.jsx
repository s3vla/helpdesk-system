import { useEffect, useState } from 'react'
import { estilos, CORES_STATUS, CORES_PRIORIDADE } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { buscarChamadosTI } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { tempoDecorrido } from '../utils/formatters'
import { LABEL_CATEGORIA } from '../utils/categorias'
import StatusBadge from './StatusBadge'
import PriorityChip from './PriorityChip'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import EstadoRequisicao from './EstadoRequisicao'

const FILTROS_STATUS = [['all', 'Todos'], ['parado', 'Parados'], ['andamento', 'Em andamento'], ['finalizado', 'Finalizados']]
const FILTROS_NIVEL = [['all', 'N1–N3'], ['N1', 'N1'], ['N2', 'N2'], ['N3', 'N3']]

// Central de Chamados: busca no backend com os filtros já traduzidos para
// os query params esperados pela API (GET /chamados?status=...&nivel=...) —
// o filtro acontece no servidor, não em memória.
function ITDashboard({ versaoDados, onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const [filtroStatus, setFiltroStatus] = useState('all')
  const [filtroNivel, setFiltroNivel] = useState('all')
  const largura = useWindowWidth()
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      setChamados(await buscarChamadosTI(token, { status: filtroStatus, nivel: filtroNivel }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoDados, filtroStatus, filtroNivel])

  const stats = [
    { label: 'Total', valor: chamados.length, cor: '#00b351' },
    { label: 'Parados', valor: chamados.filter(c => c.status === 'parado').length, cor: '#64748b' },
    { label: 'Em andamento', valor: chamados.filter(c => c.status === 'andamento').length, cor: '#f59e0b' },
    { label: 'Finalizados', valor: chamados.filter(c => c.status === 'finalizado').length, cor: '#22c55e' },
  ]

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 26 }}>
        <h1 style={estilos.sectionTitle}>Central de Chamados</h1>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: 0 }}>Todos os chamados abertos no sistema</p>
      </div>

      {!carregando && !erro && (
        <div style={{ display: 'grid', gridTemplateColumns: largura < 600 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 26 }}>
          {stats.map(s => (
            <div key={s.label} style={{ ...estilos.card, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 30, color: s.cor, lineHeight: 1 }}>{s.valor}</div>
              <div style={{ color: '#7b92b4', fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#4a5f7a', fontFamily: 'Outfit, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 2 }}>Status:</span>
        {FILTROS_STATUS.map(([valor, label]) => {
          const ativo = filtroStatus === valor
          const cor = valor !== 'all' ? CORES_STATUS[valor].fg : '#7b92b4'
          return (
            <button key={valor} onClick={() => setFiltroStatus(valor)}
              style={{ background: ativo ? `${cor}1a` : 'rgba(255,255,255,0.04)', color: ativo ? cor : '#7b92b4', border: `1px solid ${ativo ? `${cor}44` : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '5px 11px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: ativo ? 600 : 400, cursor: 'pointer' }}>
              {label}
            </button>
          )
        })}
        <span style={{ color: '#4a5f7a', fontFamily: 'Outfit, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 6, marginRight: 2 }}>Nível:</span>
        {FILTROS_NIVEL.map(([valor, label]) => (
          <button key={valor} onClick={() => setFiltroNivel(valor)}
            style={{ background: filtroNivel === valor ? 'rgba(129,140,248,0.14)' : 'rgba(255,255,255,0.04)', color: filtroNivel === valor ? '#818cf8' : '#7b92b4', border: `1px solid ${filtroNivel === valor ? 'rgba(129,140,248,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '5px 11px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: filtroNivel === valor ? 600 : 400, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {largura >= 900 && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 80px 60px 90px 100px', gap: 10, padding: '6px 16px', color: '#3a4f6a', fontFamily: 'Outfit, sans-serif', fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              <span>Chamado</span><span>Colaborador</span><span>Cat.</span><span>Nível</span><span>Prioridade</span><span>Status</span>
            </div>
          )}
          {chamados.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#4a5f7a', fontSize: 14 }}>Nenhum chamado encontrado</div>
          )}
          {chamados.map(chamado => {
            const corPrioridade = CORES_PRIORIDADE[chamado.priority].dot
            return (
              <div key={chamado.id} onClick={() => onSelect(chamado)}
                style={{ ...estilos.card, display: largura >= 900 ? 'grid' : 'flex', flexDirection: 'column', gridTemplateColumns: largura >= 900 ? '2fr 1.1fr 80px 60px 90px 100px' : undefined, gap: 10, padding: '14px 16px', cursor: 'pointer', alignItems: 'center', borderLeft: `3px solid ${corPrioridade}` }}>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: '#f0f4ff', marginBottom: 3 }}>{chamado.summary}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: '#4a5f7a', fontSize: 12 }}>{tempoDecorrido(chamado.created)}</span>
                    <AguardandoRespostaBadge status={chamado.status} aguardandoRespostaDe={chamado.aguardandoRespostaDe} isIT />
                  </div>
                </div>
                {largura >= 900 ? (
                  <>
                    <div>
                      <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{chamado.solicitanteNome}</div>
                      <div style={{ color: '#4a5f7a', fontSize: 11 }}>{chamado.solicitanteDept}</div>
                    </div>
                    <span style={{ color: '#7b92b4', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category]}</span>
                    <span style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{chamado.level}</span>
                    <PriorityChip priority={chamado.priority} />
                    <StatusBadge status={chamado.status} />
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <StatusBadge status={chamado.status} />
                    <PriorityChip priority={chamado.priority} />
                    <span style={{ color: '#7b92b4', fontSize: 12 }}>{chamado.solicitanteNome?.split(' ')[0]} · {LABEL_CATEGORIA[chamado.category]}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </EstadoRequisicao>
    </div>
  )
}

export default ITDashboard
