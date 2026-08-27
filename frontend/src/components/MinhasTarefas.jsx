import { useRef, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { useListaCarregarMais } from '../hooks/useListaCarregarMais'
import { buscarTarefas, atualizarTarefa, removerTarefa } from '../services/tarefasService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { formatarData } from '../utils/formatters'
import { IconPlus, IconEdit, IconTrash } from './icons'
import TarefaModal from './TarefaModal'

const COLUNAS = [
  { status: 'A_FAZER', label: 'A fazer', cor: CORES_APP.textoSuave },
  { status: 'FAZENDO', label: 'Fazendo', cor: '#f59e0b' },
  { status: 'CONCLUIDO', label: 'Concluído', cor: '#00b351' },
]

const LIMIAR_ARRASTE_PX = 6

// Mesma lógica/valor de MyTickets.jsx: altura reservada acima da lista de
// cards de cada coluna, pra `calc(100vh - ALTURA_RESERVADA_COLUNA)` deixar
// só o card list rolando — uma coluna com muitas tarefas nunca estica a
// página inteira pra baixo.
const ALTURA_RESERVADA_COLUNA = 300

// "Minhas Tarefas" — bloco de notas pessoal com status, SEM nenhuma
// relação com Chamado. Cada usuário (colaborador ou técnico) só vê/mexe
// nas próprias (GET /tarefas já filtra pelo token, nunca por um id
// escolhido aqui).
//
// Cada coluna pagina de forma INDEPENDENTE via useListaCarregarMais (mais
// recentes primeiro, "carregar mais" em vez do histórico inteiro de uma
// vez só — mesmo raciocínio de MyTickets.jsx, pensando em anos de tarefas
// acumuladas, principalmente em "Concluído").
//
// Mover de coluna é feito arrastando o card (drag and drop). Implementado
// com Pointer Events nativos (setPointerCapture + elementFromPoint) em vez
// da API HTML5 de drag-and-drop (draggable/onDragStart) porque essa API
// não funciona em touch — e em vez de uma lib (@dnd-kit etc) porque
// Pointer Events já cobrem mouse/touch/caneta com um único código, sem
// dependência nova. `touchAction: 'none'` no card é necessário pro touch
// não brigar com o scroll da página durante o arraste.
function MinhasTarefas() {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const [erroAcao, setErroAcao] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState(null)
  const [processandoId, setProcessandoId] = useState(null)
  const [arrastandoId, setArrastandoId] = useState(null)
  const [arrastandoOrigem, setArrastandoOrigem] = useState(null)
  const [colunaAlvo, setColunaAlvo] = useState(null)
  const arrasteRef = useRef(null)

  function buscarColuna(status) {
    return async limite => {
      try {
        return await buscarTarefas(token, { status, limite })
      } catch (e) {
        tratarErroApi(e)
        throw e
      }
    }
  }

  // Hooks sempre nas 3 mesmas posições (nunca dentro de COLUNAS.map) —
  // regra de hooks do React.
  const aFazer = useListaCarregarMais(buscarColuna('A_FAZER'), 'A_FAZER')
  const fazendo = useListaCarregarMais(buscarColuna('FAZENDO'), 'FAZENDO')
  const concluido = useListaCarregarMais(buscarColuna('CONCLUIDO'), 'CONCLUIDO')
  const colunasEstado = { A_FAZER: aFazer, FAZENDO: fazendo, CONCLUIDO: concluido }

  function recarregarTudo() {
    aFazer.recarregar()
    fazendo.recarregar()
    concluido.recarregar()
  }

  async function mover(tarefa, novoStatus) {
    const origem = colunasEstado[tarefa.status]
    const destino = colunasEstado[novoStatus]
    setProcessandoId(tarefa.id)
    // Otimista: já reflete a nova coluna na tela, sem esperar a resposta —
    // é a interação central da tela, então precisa parecer instantânea.
    // A posição exata dentro da coluna de destino (ordem real é por
    // criadaEm, não por quando foi movida) e as contagens se acertam
    // sozinhas no recarregar() silencioso logo abaixo, sucesso ou erro.
    origem.definirItensLocal(prev => prev.filter(t => t.id !== tarefa.id))
    destino.definirItensLocal(prev => [{ ...tarefa, status: novoStatus }, ...prev])
    try {
      await atualizarTarefa(token, tarefa.id, { status: novoStatus })
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      origem.recarregar()
      destino.recarregar()
      setProcessandoId(null)
    }
  }

  async function excluir(id) {
    setProcessandoId(id)
    try {
      await removerTarefa(token, id)
      setConfirmandoExclusaoId(null)
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      recarregarTudo()
      setProcessandoId(null)
    }
  }

  function aoSalvarModal() {
    setModalAberto(false)
    setEditando(null)
    recarregarTudo()
  }

  function aoPressionarCard(e, tarefa) {
    if (e.target.closest('button')) return
    if (processandoId === tarefa.id) return
    arrasteRef.current = { tarefa, x0: e.clientX, y0: e.clientY, iniciou: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function aoMoverPonteiro(e) {
    const arraste = arrasteRef.current
    if (!arraste) return
    if (!arraste.iniciou) {
      const dist = Math.hypot(e.clientX - arraste.x0, e.clientY - arraste.y0)
      if (dist < LIMIAR_ARRASTE_PX) return
      arraste.iniciou = true
      setArrastandoId(arraste.tarefa.id)
      setArrastandoOrigem(arraste.tarefa.status)
    }
    const elemento = document.elementFromPoint(e.clientX, e.clientY)
    const coluna = elemento?.closest('[data-coluna-status]')
    setColunaAlvo(coluna?.dataset.colunaStatus ?? null)
  }

  function finalizarArraste(e) {
    const arraste = arrasteRef.current
    if (!arraste) return
    arrasteRef.current = null
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* já liberado */ }
    if (arraste.iniciou && colunaAlvo && colunaAlvo !== arraste.tarefa.status) {
      mover(arraste.tarefa, colunaAlvo)
    }
    setArrastandoId(null)
    setArrastandoOrigem(null)
    setColunaAlvo(null)
  }

  return (
    <>
    <div className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Minhas Tarefas</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Sua lista pessoal — só você vê e edita. Arraste um card para mudar o status.</p>
        </div>
        <button onClick={() => { setEditando(null); setModalAberto(true) }}
          style={{ ...estilos.btnPrimary, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}>
          <IconPlus width={15} height={15} /> Nova tarefa
        </button>
      </div>

      {erroAcao && (
        <p style={{ color: CORES_APP.erro, fontSize: 13, margin: '0 0 16px' }}>{erroAcao}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: largura < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {COLUNAS.map(coluna => {
          const estado = colunasEstado[coluna.status]
          const destacada = arrastandoId !== null && colunaAlvo === coluna.status && colunaAlvo !== arrastandoOrigem
          return (
            <div key={coluna.status} data-coluna-status={coluna.status}
              style={{
                display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, borderRadius: 12, padding: 6, margin: -6,
                transition: 'background-color 0.15s, box-shadow 0.15s',
                ...(destacada ? { background: `${coluna.cor}14`, boxShadow: `0 0 0 2px ${coluna.cor}` } : {}),
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: CORES_APP.fundoCampo, borderRadius: 10, border: `1px solid ${coluna.cor}30` }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: coluna.cor, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: coluna.cor }}>{coluna.label}</span>
                {/* Contagem TOTAL da coluna (vem do backend), continua
                    certa mesmo com só parte dos itens carregada. */}
                <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_APP.textoSuave }}>{estado.carregando ? '…' : estado.total}</span>
              </div>
              {/* Altura máxima fixa + rolagem interna PRÓPRIA da coluna —
                  mesmo padrão de MyTickets.jsx. `data-coluna-status` fica
                  no wrapper de FORA (acima), não aqui: elementFromPoint
                  durante o arraste sobe até ele via closest() não importa
                  de qual elemento (inclusive de dentro desta área que
                  rola) o ponteiro estiver por cima. "Carregar mais" fica
                  DENTRO dessa área, no fim da lista. */}
              <div style={{ maxHeight: `calc(100vh - ${ALTURA_RESERVADA_COLUNA}px)`, minHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {estado.carregando ? (
                  <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13 }}>Carregando...</div>
                ) : estado.erro && estado.itens.length === 0 ? (
                  <div style={{ padding: '18px 14px', textAlign: 'center', border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>
                    <p style={{ color: CORES_APP.erro, fontSize: 12.5, margin: '0 0 8px' }}>Não foi possível carregar.</p>
                    <button onClick={estado.tentarNovamente} style={{ ...estilos.btnGhost, padding: '6px 14px', fontSize: 12 }}>Tentar novamente</button>
                  </div>
                ) : estado.itens.length === 0 ? (
                  <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13, border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>Nenhuma tarefa</div>
                ) : (
                  <>
                    {estado.itens.map(tarefa => (
                      <div key={tarefa.id}
                        onPointerDown={e => aoPressionarCard(e, tarefa)}
                        onPointerMove={aoMoverPonteiro}
                        onPointerUp={finalizarArraste}
                        onPointerCancel={finalizarArraste}
                        style={{
                          ...estilos.card, borderLeft: `3px solid ${coluna.cor}`, padding: '14px 15px', minWidth: 0, flexShrink: 0,
                          opacity: arrastandoId === tarefa.id ? 0.4 : (processandoId === tarefa.id ? 0.6 : 1),
                          cursor: arrastandoId === tarefa.id ? 'grabbing' : 'grab',
                          touchAction: 'none', userSelect: arrastandoId === tarefa.id ? 'none' : 'auto',
                        }}>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: CORES_APP.tinta, marginBottom: tarefa.descricao ? 4 : 10, lineHeight: 1.4, overflowWrap: 'break-word' }}>
                          {tarefa.titulo}
                        </div>
                        {tarefa.descricao && (
                          <p style={{ color: CORES_APP.textoFraco, fontSize: 12.5, lineHeight: 1.5, margin: '0 0 10px', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {tarefa.descricao}
                          </p>
                        )}
                        <div style={{ color: CORES_APP.textoSuave, fontSize: 11, marginBottom: 10 }}>{formatarData(new Date(tarefa.atualizadaEm))}</div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => { setEditando(tarefa); setModalAberto(true) }} disabled={processandoId === tarefa.id}
                            title="Editar"
                            style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.textoFraco, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <IconEdit width={13} height={13} />
                          </button>
                          <button onClick={() => setConfirmandoExclusaoId(tarefa.id)} disabled={processandoId === tarefa.id}
                            title="Excluir"
                            style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.erro, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' }}>
                            <IconTrash width={13} height={13} />
                          </button>
                        </div>

                        {confirmandoExclusaoId === tarefa.id && (
                          <div style={{ marginTop: 10, padding: '9px 11px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ color: CORES_APP.erro, fontSize: 12.5 }}>Excluir esta tarefa?</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => excluir(tarefa.id)} disabled={processandoId === tarefa.id}
                                style={{ background: 'rgba(192,57,43,0.12)', color: CORES_APP.erro, border: '1px solid rgba(192,57,43,0.3)', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                                {processandoId === tarefa.id ? 'Excluindo...' : 'Sim, excluir'}
                              </button>
                              <button onClick={() => setConfirmandoExclusaoId(null)} disabled={processandoId === tarefa.id}
                                style={{ background: CORES_APP.card, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, padding: '6px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {estado.temMais && (
                      <button onClick={estado.carregarMais} disabled={estado.carregandoMais}
                        style={{ ...estilos.btnGhost, flexShrink: 0, padding: '9px 14px', fontSize: 12.5, opacity: estado.carregandoMais ? 0.7 : 1, cursor: estado.carregandoMais ? 'default' : 'pointer' }}>
                        {estado.carregandoMais ? 'Carregando...' : `Carregar mais (${estado.total - estado.itens.length} restantes)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {modalAberto && (
      <TarefaModal
        tarefaEmEdicao={editando}
        onFechar={() => { setModalAberto(false); setEditando(null) }}
        onSalvou={aoSalvarModal}
      />
    )}
    </>
  )
}

export default MinhasTarefas
