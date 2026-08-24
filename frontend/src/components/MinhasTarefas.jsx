import { useEffect, useState } from 'react'
import { estilos, CORES_APP, CORES_TI } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { buscarTarefas, atualizarTarefa, removerTarefa } from '../services/tarefasService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { formatarData } from '../utils/formatters'
import { IconPlus, IconEdit, IconTrash, IconChevronRight, IconCheckCircle } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import TarefaModal from './TarefaModal'

// Ordem fixa das 3 colunas — também usada pra calcular o "próximo"/
// "anterior" status dos botões de mover (← →), já que não há
// drag-and-drop (decisão explícita do pedido: botão é aceitável quando
// mais simples que D&D sem lib nenhuma no projeto).
const COLUNAS = [
  { status: 'A_FAZER', label: 'A fazer', cor: CORES_APP.textoSuave },
  { status: 'FAZENDO', label: 'Fazendo', cor: '#f59e0b' },
  { status: 'CONCLUIDO', label: 'Concluído', cor: '#00b351' },
]

// "Minhas Tarefas" — bloco de notas pessoal com status, SEM nenhuma
// relação com Chamado. Cada usuário (colaborador ou técnico) só vê/mexe
// nas próprias (GET /tarefas já filtra pelo token, nunca por um id
// escolhido aqui).
function MinhasTarefas() {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const [tarefas, setTarefas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState(null)
  const [processandoId, setProcessandoId] = useState(null)

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      setTarefas(await buscarTarefas(token))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function mover(tarefa, novoStatus) {
    setProcessandoId(tarefa.id)
    // Otimista: já reflete a nova coluna na tela, sem esperar a resposta —
    // é a interação central da tela (equivalente ao "arrastar"), então
    // precisa parecer instantânea. Reverte via buscar() de novo só se der
    // erro.
    setTarefas(prev => prev.map(t => (t.id === tarefa.id ? { ...t, status: novoStatus } : t)))
    try {
      await atualizarTarefa(token, tarefa.id, { status: novoStatus })
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
      await buscar()
    } finally {
      setProcessandoId(null)
    }
  }

  async function excluir(id) {
    setProcessandoId(id)
    try {
      await removerTarefa(token, id)
      setConfirmandoExclusaoId(null)
      await buscar()
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setProcessandoId(null)
    }
  }

  function aoSalvarModal() {
    setModalAberto(false)
    setEditando(null)
    buscar()
  }

  return (
    <>
    <div className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Minhas Tarefas</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Sua lista pessoal — só você vê e edita</p>
        </div>
        <button onClick={() => { setEditando(null); setModalAberto(true) }}
          style={{ ...estilos.btnPrimary, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}>
          <IconPlus width={15} height={15} /> Nova tarefa
        </button>
      </div>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        <div style={{ display: 'grid', gridTemplateColumns: largura < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {COLUNAS.map((coluna, indice) => {
            const cards = tarefas.filter(t => t.status === coluna.status)
            const colunaAnterior = COLUNAS[indice - 1]
            const proximaColuna = COLUNAS[indice + 1]
            return (
              <div key={coluna.status} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: CORES_APP.fundoCampo, borderRadius: 10, border: `1px solid ${coluna.cor}30` }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: coluna.cor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: coluna.cor }}>{coluna.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_APP.textoSuave }}>{cards.length}</span>
                </div>
                {cards.length === 0
                  ? <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13, border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>Nenhuma tarefa</div>
                  : cards.map(tarefa => (
                    <div key={tarefa.id} style={{ ...estilos.card, borderLeft: `3px solid ${coluna.cor}`, padding: '14px 15px', minWidth: 0, opacity: processandoId === tarefa.id ? 0.6 : 1 }}>
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
                        <button onClick={() => colunaAnterior && mover(tarefa, colunaAnterior.status)} disabled={!colunaAnterior || processandoId === tarefa.id}
                          title={colunaAnterior ? `Mover para "${colunaAnterior.label}"` : undefined}
                          style={{ background: CORES_APP.fundoCampo, border: 'none', color: colunaAnterior ? CORES_APP.textoFraco : CORES_APP.borda, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: colunaAnterior ? 'pointer' : 'default', flexShrink: 0 }}>
                          <IconChevronRight width={13} height={13} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <button onClick={() => { setEditando(tarefa); setModalAberto(true) }} disabled={processandoId === tarefa.id}
                          title="Editar"
                          style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.textoFraco, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <IconEdit width={13} height={13} />
                        </button>
                        <button onClick={() => setConfirmandoExclusaoId(tarefa.id)} disabled={processandoId === tarefa.id}
                          title="Excluir"
                          style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.erro, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <IconTrash width={13} height={13} />
                        </button>
                        <button onClick={() => proximaColuna && mover(tarefa, proximaColuna.status)} disabled={!proximaColuna || processandoId === tarefa.id}
                          title={proximaColuna ? `Mover para "${proximaColuna.label}"` : undefined}
                          style={{ background: CORES_APP.fundoCampo, border: 'none', color: proximaColuna ? CORES_TI.accent : CORES_APP.borda, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: proximaColuna ? 'pointer' : 'default', flexShrink: 0, marginLeft: 'auto' }}>
                          {coluna.status === 'FAZENDO' ? <IconCheckCircle width={13} height={13} /> : <IconChevronRight width={13} height={13} />}
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
                  ))
                }
              </div>
            )
          })}
        </div>
      </EstadoRequisicao>
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
