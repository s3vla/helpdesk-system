import { useEffect, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { buscarAnotacoes, removerAnotacao } from '../services/anotacoesService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { formatarDataHora } from '../utils/formatters'
import { IconPlus, IconEdit, IconTrash } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import AnotacaoModal from './AnotacaoModal'

// "Minhas Anotações" — bloco de notas de texto livre, SEM nenhuma relação
// com Chamado nem com Tarefa (feature separada, ver pedido). Cada usuário
// só vê/mexe nas próprias (GET /anotacoes já filtra pelo token).
function MinhasAnotacoes() {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const [anotacoes, setAnotacoes] = useState([])
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
      setAnotacoes(await buscarAnotacoes(token))
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

  async function excluir(id) {
    setProcessandoId(id)
    try {
      await removerAnotacao(token, id)
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
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Minhas Anotações</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Bloco de notas pessoal — só você vê e edita</p>
        </div>
        <button onClick={() => { setEditando(null); setModalAberto(true) }}
          style={{ ...estilos.btnPrimary, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}>
          <IconPlus width={15} height={15} /> Nova anotação
        </button>
      </div>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {anotacoes.length === 0 ? (
          <div style={{ ...estilos.card, padding: 32, textAlign: 'center' }}>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Nenhuma anotação ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {anotacoes.map(anotacao => (
              <div key={anotacao.id} style={{ ...estilos.card, padding: '14px 15px', display: 'flex', flexDirection: 'column', minWidth: 0, opacity: processandoId === anotacao.id ? 0.6 : 1 }}>
                <p style={{
                  color: CORES_APP.texto, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
                  display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
                }}>
                  {anotacao.conteudo}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>{formatarDataHora(new Date(anotacao.atualizadaEm))}</span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => { setEditando(anotacao); setModalAberto(true) }} disabled={processandoId === anotacao.id}
                      title="Editar"
                      style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.textoFraco, width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <IconEdit width={12} height={12} />
                    </button>
                    <button onClick={() => setConfirmandoExclusaoId(anotacao.id)} disabled={processandoId === anotacao.id}
                      title="Excluir"
                      style={{ background: CORES_APP.fundoCampo, border: 'none', color: CORES_APP.erro, width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <IconTrash width={12} height={12} />
                    </button>
                  </div>
                </div>

                {confirmandoExclusaoId === anotacao.id && (
                  <div style={{ marginTop: 10, padding: '9px 11px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ color: CORES_APP.erro, fontSize: 12.5 }}>Excluir esta anotação?</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => excluir(anotacao.id)} disabled={processandoId === anotacao.id}
                        style={{ background: 'rgba(192,57,43,0.12)', color: CORES_APP.erro, border: '1px solid rgba(192,57,43,0.3)', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                        {processandoId === anotacao.id ? 'Excluindo...' : 'Sim, excluir'}
                      </button>
                      <button onClick={() => setConfirmandoExclusaoId(null)} disabled={processandoId === anotacao.id}
                        style={{ background: CORES_APP.card, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, padding: '6px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </EstadoRequisicao>
    </div>

    {modalAberto && (
      <AnotacaoModal
        anotacaoEmEdicao={editando}
        onFechar={() => { setModalAberto(false); setEditando(null) }}
        onSalvou={aoSalvarModal}
      />
    )}
    </>
  )
}

export default MinhasAnotacoes
