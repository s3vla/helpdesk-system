import { useEffect, useState } from 'react'
import { estilos, CORES_APP, CORES_STATUS_SUGESTAO } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { buscarSugestaoDetalhe, criarComentarioForum, atualizarStatusSugestao } from '../services/forumService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { formatarDataHora } from '../utils/formatters'
import { IconChevronRight } from './icons'
import EstadoRequisicao from './EstadoRequisicao'

const STATUS_ORDEM = ['ABERTA', 'EM_ANALISE', 'IMPLEMENTADA', 'RECUSADA']

// Detalhe de uma sugestão: mensagem completa + thread de comentários (mais
// antigo primeiro, mesma ordem de leitura de uma conversa) + campo pra
// comentar. Seletor de status só aparece pra técnico (`podeAlterarStatus`,
// decidido por App.jsx conforme a área logada) — colaborador vê só o
// badge, igual MuralAvisos separa `podePublicar`.
function ForumDetalheSugestao({ sugestaoId, podeAlterarStatus, onVoltar }) {
  const { token, tratarErroApi } = useAuth()
  const [sugestao, setSugestao] = useState(null)
  const [comentarios, setComentarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [textoComentario, setTextoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [erroComentario, setErroComentario] = useState('')
  const [alterandoStatus, setAlterandoStatus] = useState(false)

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarSugestaoDetalhe(token, sugestaoId)
      setSugestao(resposta.sugestao)
      setComentarios(resposta.comentarios)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugestaoId])

  async function enviarComentario() {
    if (!textoComentario.trim()) return
    setEnviandoComentario(true)
    setErroComentario('')
    try {
      const novo = await criarComentarioForum(token, sugestaoId, textoComentario.trim())
      setComentarios(prev => [...prev, novo])
      setTextoComentario('')
      setSugestao(prev => ({ ...prev, totalComentarios: prev.totalComentarios + 1 }))
    } catch (e) {
      if (!tratarErroApi(e)) setErroComentario(traduzirErroApi(e))
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function mudarStatus(novoStatus) {
    if (novoStatus === sugestao.status) return
    setAlterandoStatus(true)
    setErro('')
    try {
      const atualizada = await atualizarStatusSugestao(token, sugestaoId, novoStatus)
      setSugestao(atualizada)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setAlterandoStatus(false)
    }
  }

  return (
    <div className="animate-fade-up" style={{ maxWidth: 720, margin: '0 auto' }}>
      <button onClick={onVoltar}
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: CORES_APP.textoFraco, fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
        <IconChevronRight width={14} height={14} style={{ transform: 'rotate(180deg)' }} /> Voltar ao Fórum
      </button>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {sugestao && (
          <>
            <div style={{ ...estilos.card, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                {podeAlterarStatus ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {STATUS_ORDEM.map(valor => {
                      const cor = CORES_STATUS_SUGESTAO[valor]
                      const selecionado = sugestao.status === valor
                      return (
                        <button key={valor} onClick={() => mudarStatus(valor)} disabled={alterandoStatus}
                          style={{
                            background: selecionado ? cor.bg : CORES_APP.fundoCampo,
                            color: selecionado ? cor.fg : CORES_APP.textoFraco,
                            border: `1px solid ${selecionado ? cor.borda : CORES_APP.borda}`,
                            borderRadius: 99, padding: '5px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif',
                            fontWeight: selecionado ? 700 : 500, cursor: alterandoStatus ? 'default' : 'pointer', transition: 'all 0.15s',
                          }}>
                          {cor.label}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <span style={{ background: CORES_STATUS_SUGESTAO[sugestao.status].bg, color: CORES_STATUS_SUGESTAO[sugestao.status].fg, border: `1px solid ${CORES_STATUS_SUGESTAO[sugestao.status].borda}`, borderRadius: 99, padding: '4px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                    {CORES_STATUS_SUGESTAO[sugestao.status].label}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: CORES_APP.tinta, margin: '0 0 6px' }}>{sugestao.titulo}</h1>
              <p style={{ color: CORES_APP.texto, fontSize: 14.5, lineHeight: 1.65, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{sugestao.mensagem}</p>
              <div style={{ color: CORES_APP.textoSuave, fontSize: 12.5 }}>
                {sugestao.autor.nome ?? sugestao.autor.email} · {formatarDataHora(new Date(sugestao.criadaEm))}
              </div>
            </div>

            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: CORES_APP.tinta, margin: '0 0 10px' }}>
              {comentarios.length === 0 ? 'Nenhum comentário ainda' : `${comentarios.length} ${comentarios.length === 1 ? 'comentário' : 'comentários'}`}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {comentarios.map(comentario => (
                <div key={comentario.id} style={{ ...estilos.card, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_APP.tinta }}>
                      {comentario.autor.nome ?? comentario.autor.email}
                    </span>
                    <span style={{ color: CORES_APP.textoSuave, fontSize: 11.5, flexShrink: 0 }}>{formatarDataHora(new Date(comentario.criadoEm))}</span>
                  </div>
                  <p style={{ color: CORES_APP.texto, fontSize: 13.5, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>{comentario.mensagem}</p>
                </div>
              ))}
            </div>

            <div style={{ ...estilos.card, padding: 14 }}>
              <textarea value={textoComentario} onChange={e => setTextoComentario(e.target.value)} placeholder="Escreva um comentário..."
                style={{ ...estilos.input, minHeight: 70, resize: 'vertical', lineHeight: 1.5, marginBottom: 10 }} disabled={enviandoComentario} />
              {erroComentario && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: '0 0 10px' }}>{erroComentario}</p>}
              <button onClick={enviarComentario} disabled={!textoComentario.trim() || enviandoComentario}
                style={{ ...estilos.btnPrimary, width: 'auto', padding: '10px 20px', opacity: enviandoComentario ? 0.7 : 1, cursor: !textoComentario.trim() || enviandoComentario ? 'not-allowed' : 'pointer' }}>
                {enviandoComentario ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
          </>
        )}
      </EstadoRequisicao>
    </div>
  )
}

export default ForumDetalheSugestao
