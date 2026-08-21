import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_STATUS, CORES_PRIORIDADE, CORES_TI, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { useAgora } from '../hooks/useAgora'
import { buscarChamadosTI } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { tempoDecorrido } from '../utils/formatters'
import { numeroChamado } from '../utils/numeroChamado'
import { LABEL_CATEGORIA } from '../utils/categorias'
import StatusBadge from './StatusBadge'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import EstadoRequisicao from './EstadoRequisicao'
import { IconSearch, IconCalendar, IconClock, IconHeadset, IconCheckCircle, IconInfo, IconEdit } from './icons'

const FILTROS_STATUS = [['all', 'Todos'], ['parado', 'Parados'], ['andamento', 'Em andamento'], ['finalizado', 'Finalizados']]
const FILTROS_NIVEL = [['all', 'N1–N3'], ['N1', 'N1'], ['N2', 'N2'], ['N3', 'N3']]
const COLUNAS_TABELA = '64px 2fr 1fr 152px 108px 118px 76px'

// Central de Chamados: busca no backend com os filtros já traduzidos para
// os query params esperados pela API (GET /chamados?status=...&nivel=...&
// busca=...) — filtro E busca acontecem no servidor, não em memória.
function ITDashboard({ versaoDados, onSelect, onAbrirChamado }) {
  const { token, tratarErroApi } = useAuth()
  const [filtroStatus, setFiltroStatus] = useState('all')
  const [filtroNivel, setFiltroNivel] = useState('all')
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const largura = useWindowWidth()
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const debounceRef = useRef(null)

  // "sem resposta há Xmin" precisa recalcular sozinho com o tempo passando,
  // não só quando algo muda — useAgora força esse re-render a cada minuto.
  useAgora(60000)

  // Busca dispara sozinha 400ms depois de parar de digitar; Enter (handler
  // no input, mais abaixo) pula essa espera. Sem debounce "de verdade" com
  // lib nenhuma — é só um setTimeout cancelado a cada tecla.
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setBusca(buscaInput.trim()), 400)
    return () => clearTimeout(debounceRef.current)
  }, [buscaInput])

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      setChamados(await buscarChamadosTI(token, { status: filtroStatus, nivel: filtroNivel, busca }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoDados, filtroStatus, filtroNivel, busca])

  function aoPressionarEnterNaBusca(e) {
    if (e.key !== 'Enter') return
    clearTimeout(debounceRef.current)
    setBusca(buscaInput.trim())
  }

  const stats = [
    { label: 'Total no mês', valor: chamados.length, cor: CORES_TI.accent, icon: IconCalendar },
    { label: 'Na fila', valor: chamados.filter(c => c.status === 'parado').length, cor: CORES_STATUS.parado.dot, icon: IconClock },
    { label: 'Em atendimento', valor: chamados.filter(c => c.status === 'andamento').length, cor: CORES_STATUS.andamento.dot, icon: IconHeadset },
    { label: 'Resolvidos', valor: chamados.filter(c => c.status === 'finalizado').length, cor: CORES_STATUS.finalizado.dot, icon: IconCheckCircle },
  ]

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 26 }}>
        <div>
          <h1 style={estilos.sectionTitle}>Central de Chamados</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Todos os chamados abertos no sistema</p>
        </div>
        <button type="button" onClick={onAbrirChamado}
          style={{ height: 42, padding: '0 18px', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff', background: '#007851', border: 0, borderRadius: 9, cursor: 'pointer', flexShrink: 0 }}>
          Criar novo chamado
        </button>
      </div>

      {!carregando && !erro && (
        <div style={{ display: 'grid', gridTemplateColumns: largura < 600 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 26 }}>
          {stats.map(s => (
            <div key={s.label} style={{ ...estilos.card, borderTop: `3px solid ${s.cor}`, borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <s.icon width={16} height={16} style={{ color: s.cor }} />
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: CORES_APP.tinta, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.valor}</div>
                <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: CORES_APP.textoSuave, fontFamily: 'Outfit, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 2 }}>Status:</span>
          {FILTROS_STATUS.map(([valor, label]) => {
            const ativo = filtroStatus === valor
            const cor = valor !== 'all' ? CORES_STATUS[valor].fg : CORES_TI.accent
            return (
              <button key={valor} onClick={() => setFiltroStatus(valor)}
                style={{ background: ativo ? `${cor}1a` : CORES_APP.fundoCampo, color: ativo ? cor : CORES_APP.textoFraco, border: `1px solid ${ativo ? `${cor}44` : CORES_APP.borda}`, borderRadius: 999, padding: '6px 13px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: ativo ? 600 : 400, cursor: 'pointer' }}>
                {label}
              </button>
            )
          })}
          <span style={{ color: CORES_APP.textoSuave, fontFamily: 'Outfit, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 6, marginRight: 2 }}>Nível:</span>
          {FILTROS_NIVEL.map(([valor, label]) => (
            <button key={valor} onClick={() => setFiltroNivel(valor)}
              style={{ background: filtroNivel === valor ? 'rgba(0,73,192,0.14)' : CORES_APP.fundoCampo, color: filtroNivel === valor ? CORES_TI.accent : CORES_APP.textoFraco, border: `1px solid ${filtroNivel === valor ? 'rgba(0,73,192,0.35)' : CORES_APP.borda}`, borderRadius: 999, padding: '6px 13px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: filtroNivel === valor ? 600 : 400, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: largura < 640 ? '1 1 100%' : '0 1 260px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, display: 'flex', pointerEvents: 'none' }}>
            <IconSearch width={14} height={14} />
          </span>
          <input value={buscaInput} onChange={e => setBuscaInput(e.target.value)} onKeyDown={aoPressionarEnterNaBusca}
            placeholder="Nº ou solicitação"
            style={{ width: '100%', boxSizing: 'border-box', height: 36, padding: '0 12px 0 32px', background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, color: CORES_APP.tinta, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
        </div>
      </div>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {largura >= 900 && (
            <div style={{ display: 'grid', gridTemplateColumns: COLUNAS_TABELA, gap: 10, padding: '6px 16px', color: CORES_APP.textoSuave, fontFamily: 'Outfit, sans-serif', fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              <span>Nº</span><span>Chamado</span><span>Solicitante</span><span>Categoria</span><span>Última atualização</span><span>Status</span><span>Ações</span>
            </div>
          )}
          {chamados.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 14 }}>Nenhum chamado encontrado</div>
          )}
          {chamados.map(chamado => {
            const corPrioridade = CORES_PRIORIDADE[chamado.priority].dot
            const semResposta = chamado.status === 'andamento' && chamado.aguardandoRespostaDe === 'TECNICO'
            return (
              <div key={chamado.id} onClick={() => onSelect(chamado)}
                style={{ ...estilos.card, display: largura >= 900 ? 'grid' : 'flex', flexDirection: 'column', gridTemplateColumns: largura >= 900 ? COLUNAS_TABELA : undefined, gap: 10, padding: '14px 16px', cursor: 'pointer', alignItems: 'center', borderLeft: `3px solid ${corPrioridade}` }}>
                {largura >= 900 && (
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: CORES_APP.textoSuave, fontVariantNumeric: 'tabular-nums' }}>{numeroChamado(chamado.id)}</span>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                    {largura < 900 && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: CORES_APP.textoSuave }}>{numeroChamado(chamado.id)}</span>}
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: CORES_APP.tinta }}>{chamado.summary}</span>
                    {chamado.priority === 'alta' && (
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, letterSpacing: '0.1em', fontWeight: 600, color: CORES_PRIORIDADE.alta.fg, background: CORES_PRIORIDADE.alta.bg, padding: '3px 6px', borderRadius: 4, flexShrink: 0 }}>ALTA</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: CORES_APP.textoSuave, fontSize: 12 }}>aberto {tempoDecorrido(chamado.created)}</span>
                    {semResposta && <span style={{ color: '#f59e0b', fontSize: 12 }}>· sem resposta {tempoDecorrido(chamado.updated)}</span>}
                    <AguardandoRespostaBadge status={chamado.status} aguardandoRespostaDe={chamado.aguardandoRespostaDe} isIT />
                  </div>
                </div>
                {largura >= 900 ? (
                  <>
                    <div>
                      <div style={{ fontSize: 13, color: CORES_APP.texto, fontWeight: 500 }}>{chamado.solicitanteNome}</div>
                      <div style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>{chamado.solicitanteDept}</div>
                    </div>
                    <span style={{ color: CORES_APP.textoFraco, fontSize: 12, fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{LABEL_CATEGORIA[chamado.category]}</span>
                    <span style={{ color: CORES_APP.textoFraco, fontSize: 12, whiteSpace: 'nowrap' }}>{tempoDecorrido(chamado.updated)}</span>
                    <span style={{ justifySelf: 'start' }}><StatusBadge status={chamado.status} /></span>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => onSelect(chamado)} title="Ver detalhe"
                        style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.textoFraco, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <IconInfo width={14} height={14} />
                      </button>
                      <button type="button" onClick={() => onSelect(chamado)} title="Editar"
                        style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.textoFraco, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <IconEdit width={14} height={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <StatusBadge status={chamado.status} />
                    <span style={{ color: CORES_APP.textoFraco, fontSize: 12 }}>{chamado.solicitanteNome?.split(' ')[0]} · {LABEL_CATEGORIA[chamado.category]}</span>
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
