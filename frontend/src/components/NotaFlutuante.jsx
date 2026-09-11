import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { atualizarAnotacao, removerAnotacao } from '../services/anotacoesService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { formatarDataHora } from '../utils/formatters'
import { IconEdit, IconTrash, IconChevronDown, IconChevronUp } from './icons'
import { useEnterParaEnviar } from '../hooks/useEnterParaEnviar'

const LARGURA = 300

// Card "janela flutuante" de uma anotação: arrastável pela barra de título,
// posição em estado local (não sobe pro pai a cada pixel movido — só a
// posição INICIAL e a ordem de foco vêm de fora). Várias instâncias desta
// componente coexistem, cada uma com seu próprio drag/expandir/editar.
function NotaFlutuante({ id, anotacao, posicaoInicial, zIndex, aoFechar, aoFocar, aoMudou }) {
  const { token } = useAuth()
  const [posicao, setPosicao] = useState(posicaoInicial)
  const [arrastando, setArrastando] = useState(false)
  const [expandido, setExpandido] = useState(true)
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const offsetRef = useRef({ x: 0, y: 0 })

  function iniciarArraste(e) {
    if (editando) return
    e.preventDefault()
    offsetRef.current = { x: e.clientX - posicao.x, y: e.clientY - posicao.y }
    setArrastando(true)
  }

  useEffect(() => {
    if (!arrastando) return
    function mover(e) {
      setPosicao({
        x: Math.min(Math.max(e.clientX - offsetRef.current.x, 4), window.innerWidth - 60),
        y: Math.min(Math.max(e.clientY - offsetRef.current.y, 4), window.innerHeight - 44),
      })
    }
    function soltar() { setArrastando(false) }
    window.addEventListener('mousemove', mover)
    window.addEventListener('mouseup', soltar)
    return () => {
      window.removeEventListener('mousemove', mover)
      window.removeEventListener('mouseup', soltar)
    }
  }, [arrastando])

  function abrirEdicao() {
    setRascunho(anotacao.conteudo)
    setErro('')
    setEditando(true)
  }

  async function salvarEdicao() {
    if (!rascunho.trim()) return
    setProcessando(true)
    setErro('')
    try {
      await atualizarAnotacao(token, id, rascunho.trim())
      setEditando(false)
      aoMudou()
    } catch (e) {
      setErro(traduzirErroApi(e))
    } finally {
      setProcessando(false)
    }
  }

  async function excluir() {
    setProcessando(true)
    try {
      await removerAnotacao(token, id)
      aoMudou()
      aoFechar(id)
    } catch (e) {
      setErro(traduzirErroApi(e))
      setProcessando(false)
    }
  }

  const aoTeclarEnter = useEnterParaEnviar(salvarEdicao)

  if (!anotacao) return null

  const primeiraLinha = anotacao.conteudo.split('\n')[0].slice(0, 48) || 'Anotação'

  return (
    <div
      onMouseDownCapture={() => aoFocar(id)}
      style={{
        position: 'fixed', left: posicao.x, top: posicao.y, width: LARGURA, zIndex,
        ...estilos.card, boxShadow: '0 14px 36px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', opacity: processando ? 0.75 : 1,
      }}>
      <div
        onMouseDown={iniciarArraste}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 8px 9px 12px',
          background: CORES_APP.fundoCampo, borderBottom: `1px solid ${CORES_APP.bordaSuave}`,
          cursor: editando ? 'default' : (arrastando ? 'grabbing' : 'grab'), userSelect: 'none',
        }}>
        <span style={{
          flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 12.5, color: CORES_APP.tinta,
        }}>
          {primeiraLinha}
        </span>
        <button onClick={() => setExpandido(v => !v)} disabled={editando} title={expandido ? 'Recolher' : 'Expandir'}
          style={botaoIcone}>
          {expandido ? <IconChevronUp width={12} height={12} /> : <IconChevronDown width={12} height={12} />}
        </button>
        <button onClick={() => aoFechar(id)} title="Fechar" style={botaoIcone}>×</button>
      </div>

      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {editando ? (
          <>
            <textarea value={rascunho} onChange={e => setRascunho(e.target.value)} onKeyDown={aoTeclarEnter} autoFocus disabled={processando}
              style={{ ...estilos.input, minHeight: 120, resize: 'vertical', lineHeight: 1.5, fontSize: 13 }} />
            {erro && <p style={{ color: CORES_APP.erro, fontSize: 12, margin: 0 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={salvarEdicao} disabled={!rascunho.trim() || processando}
                style={{ ...estilos.btnPrimary, padding: '8px 14px', fontSize: 12.5, flex: 1, cursor: !rascunho.trim() || processando ? 'not-allowed' : 'pointer' }}>
                {processando ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setEditando(false)} disabled={processando}
                style={{ ...estilos.btnGhost, padding: '8px 14px', fontSize: 12.5, flex: 1, textAlign: 'center' }}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{
              color: CORES_APP.texto, fontSize: 13, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
              ...(expandido
                ? { maxHeight: 260, overflowY: 'auto' }
                : { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
            }}>
              {anotacao.conteudo}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 6, borderTop: `1px solid ${CORES_APP.bordaSuave}` }}>
              <span style={{ color: CORES_APP.textoSuave, fontSize: 10.5 }}>{formatarDataHora(new Date(anotacao.atualizadaEm))}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={abrirEdicao} disabled={processando} title="Editar" style={botaoIcone}>
                  <IconEdit width={11} height={11} />
                </button>
                <button onClick={() => setConfirmandoExclusao(true)} disabled={processando} title="Excluir" style={{ ...botaoIcone, color: CORES_APP.erro }}>
                  <IconTrash width={11} height={11} />
                </button>
              </div>
            </div>
            {erro && <p style={{ color: CORES_APP.erro, fontSize: 12, margin: 0 }}>{erro}</p>}
            {confirmandoExclusao && (
              <div style={{ padding: '8px 10px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ color: CORES_APP.erro, fontSize: 12 }}>Excluir esta anotação?</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={excluir} disabled={processando}
                    style={{ background: 'rgba(192,57,43,0.12)', color: CORES_APP.erro, border: '1px solid rgba(192,57,43,0.3)', borderRadius: 7, padding: '6px 10px', fontSize: 11.5, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', flex: 1 }}>
                    {processando ? 'Excluindo...' : 'Sim, excluir'}
                  </button>
                  <button onClick={() => setConfirmandoExclusao(false)} disabled={processando}
                    style={{ background: CORES_APP.card, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, padding: '6px 10px', fontSize: 11.5, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer', flex: 1 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const botaoIcone = {
  background: 'transparent', border: 'none', color: CORES_APP.textoFraco, width: 22, height: 22, borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 15, lineHeight: 1,
}

export default NotaFlutuante
