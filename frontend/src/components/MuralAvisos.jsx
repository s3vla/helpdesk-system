import { useEffect, useState } from 'react'
import { estilos, CORES_APP, CORES_TI, CORES_TIPO_AVISO } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { buscarAvisos, marcarAvisoLido, removerAviso, atualizarAviso, buscarLeitoresAviso } from '../services/avisosService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { formatarDataHora } from '../utils/formatters'
import { IconAlertTriangle, IconClock, IconInfo, IconEdit, IconTrash, IconPlus, IconChevronDown, IconChevronUp } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import PublicarAvisoModal from './PublicarAvisoModal'
import Paginacao from './Paginacao'

// Ícone por tipo — a cor/rótulo vem de CORES_TIPO_AVISO (theme.js), única
// fonte compartilhada com PublicarAvisoModal.jsx. Ícone fica só aqui porque
// é detalhe de renderização, não de tema (mesmo padrão de CORES_STATUS/
// CORES_PRIORIDADE, que também nunca carregam componente React dentro de
// theme.js).
const ICONES_TIPO = { INFORMATIVO: IconInfo, ALERTA: IconAlertTriangle, MANUTENCAO: IconClock }

// Mural de Avisos — leitura pra todo mundo, publicação/edição/exclusão só
// pra técnico (`podePublicar`, decidido pelo App.jsx conforme a área
// logada). Ao abrir a tela, todo aviso não lido vira lido automaticamente
// (POST /avisos/:id/marcar-lido em lote) — não precisa de clique extra por
// item, "ver o mural" já conta como "visualizar".
function MuralAvisos({ podePublicar, onAlterou }) {
  const { token, tratarErroApi } = useAuth()
  const [avisos, setAvisos] = useState([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState(null)
  const [processandoId, setProcessandoId] = useState(null)
  const [leitoresAbertoId, setLeitoresAbertoId] = useState(null)
  const [leitoresPorAviso, setLeitoresPorAviso] = useState({})
  const [carregandoLeitoresId, setCarregandoLeitoresId] = useState(null)

  // "Marca como lido" só cobre os avisos da página atual — abrir a página
  // 1 do mural não deveria disparar uma marcação em lote de avisos de
  // outras páginas que nem estão sendo mostrados agora.
  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarAvisos(token, { pagina })
      setAvisos(resposta.itens)
      setTotalPaginas(resposta.totalPaginas)
      const naoLidos = resposta.itens.filter(a => !a.lido)
      if (naoLidos.length > 0) {
        await Promise.all(naoLidos.map(a => marcarAvisoLido(token, a.id)))
        setAvisos(resposta.itens.map(a => ({ ...a, lido: true })))
        onAlterou?.()
      }
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina])

  async function alternarFixado(aviso) {
    setProcessandoId(aviso.id)
    try {
      await atualizarAviso(token, aviso.id, { fixado: !aviso.fixado })
      await buscar()
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setProcessandoId(null)
    }
  }

  async function excluir(id) {
    setProcessandoId(id)
    try {
      await removerAviso(token, id)
      setConfirmandoExclusaoId(null)
      await buscar()
      onAlterou?.()
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

  // Carrega sob demanda (só no primeiro clique de cada aviso, depois fica
  // em cache local) — evita N requisições extras pra avisos que ninguém
  // vai querer conferir "quem leu".
  async function alternarLeitores(avisoId) {
    if (leitoresAbertoId === avisoId) {
      setLeitoresAbertoId(null)
      return
    }
    setLeitoresAbertoId(avisoId)
    if (leitoresPorAviso[avisoId]) return
    setCarregandoLeitoresId(avisoId)
    try {
      const lista = await buscarLeitoresAviso(token, avisoId)
      setLeitoresPorAviso(prev => ({ ...prev, [avisoId]: lista }))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregandoLeitoresId(null)
    }
  }

  // O modal (position: fixed, precisa se posicionar relativo à VIEWPORT)
  // fica FORA da div abaixo de propósito: `.animate-fade-up` usa uma
  // animation com transform nos keyframes, e um ancestral com transform
  // (mesmo em repouso, `fill-mode: both` mantém o valor do keyframe final
  // aplicado pra sempre) vira containing block pra descendentes
  // position:fixed — na prática, o modal passava a se posicionar relativo
  // a ESTA div (que rola junto com a página) em vez de relativo à tela,
  // cortando o cabeçalho pra fora da área visível sempre que o conteúdo
  // da tela empurrava essa div pra baixo o suficiente.
  return (
    <>
    <div className="animate-fade-up" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={estilos.sectionTitle}>Mural de Avisos</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Comunicados da equipe de TI para toda a empresa</p>
        </div>
        {podePublicar && (
          <button onClick={() => { setEditando(null); setModalAberto(true) }}
            style={{ ...estilos.btnPrimary, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}>
            <IconPlus width={15} height={15} /> Publicar aviso
          </button>
        )}
      </div>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {avisos.length === 0 ? (
          <div style={{ ...estilos.card, padding: 32, textAlign: 'center' }}>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Nenhum aviso no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {avisos.map(aviso => {
              const cor = CORES_TIPO_AVISO[aviso.tipo]
              const Icone = ICONES_TIPO[aviso.tipo]
              return (
                <div key={aviso.id} style={{
                  ...estilos.card, padding: '16px 18px',
                  borderColor: !aviso.lido ? 'rgba(0,120,81,0.35)' : CORES_APP.borda,
                  background: !aviso.lido ? 'rgba(0,179,81,0.04)' : CORES_APP.card,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: cor.bg, color: cor.fg, border: `1px solid ${cor.borda}`, borderRadius: 99, padding: '3px 10px 3px 8px', fontSize: 11.5, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                        <Icone width={12} height={12} /> {cor.label}
                      </span>
                      {aviso.fixado && (
                        <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 99, padding: '3px 10px', fontSize: 11.5, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                          Fixado
                        </span>
                      )}
                      {!aviso.lido && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00b351', display: 'inline-block', flexShrink: 0 }} title="Não lido" />
                      )}
                    </div>
                    {podePublicar && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => alternarFixado(aviso)} disabled={processandoId === aviso.id}
                          title={aviso.fixado ? 'Desfixar' : 'Fixar no topo'}
                          style={{ background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CORES_APP.textoFraco, cursor: 'pointer', fontSize: 13 }}>
                          📌
                        </button>
                        <button onClick={() => { setEditando(aviso); setModalAberto(true) }} disabled={processandoId === aviso.id}
                          title="Editar"
                          style={{ background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CORES_APP.textoFraco, cursor: 'pointer' }}>
                          <IconEdit width={13} height={13} />
                        </button>
                        <button onClick={() => setConfirmandoExclusaoId(aviso.id)} disabled={processandoId === aviso.id}
                          title="Excluir"
                          style={{ background: 'none', border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CORES_APP.erro, cursor: 'pointer' }}>
                          <IconTrash width={13} height={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15.5, color: CORES_APP.tinta, margin: '10px 0 4px' }}>{aviso.titulo}</h3>
                  <p style={{ color: CORES_APP.texto, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{aviso.mensagem}</p>

                  <div style={{ color: CORES_APP.textoSuave, fontSize: 12 }}>
                    {aviso.autor.nome ?? aviso.autor.email} · {formatarDataHora(new Date(aviso.publicadoEm))}
                    {aviso.expiraEm && ` · expira em ${formatarDataHora(new Date(aviso.expiraEm))}`}
                  </div>

                  {podePublicar && (
                    <div style={{ marginTop: 8 }}>
                      {aviso.totalLeitores > 0 ? (
                        <button onClick={() => alternarLeitores(aviso.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: CORES_TI.accent, fontSize: 12.5, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                          Visto por {aviso.totalLeitores} {aviso.totalLeitores > 1 ? 'pessoas' : 'pessoa'}
                          {leitoresAbertoId === aviso.id ? <IconChevronUp width={13} height={13} /> : <IconChevronDown width={13} height={13} />}
                        </button>
                      ) : (
                        <span style={{ color: CORES_APP.textoSuave, fontSize: 12.5 }}>Ainda não visto por ninguém</span>
                      )}

                      {leitoresAbertoId === aviso.id && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: CORES_APP.fundoCampo, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {carregandoLeitoresId === aviso.id ? (
                            <span style={{ color: CORES_APP.textoSuave, fontSize: 12.5 }}>Carregando...</span>
                          ) : (
                            (leitoresPorAviso[aviso.id] ?? []).map(leitor => (
                              <div key={leitor.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
                                <span style={{ color: CORES_APP.texto }}>{leitor.nome ?? leitor.email}</span>
                                <span style={{ color: CORES_APP.textoSuave, flexShrink: 0 }}>{formatarDataHora(new Date(leitor.lidoEm))}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {confirmandoExclusaoId === aviso.id && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ color: CORES_APP.erro, fontSize: 13 }}>Excluir este aviso permanentemente?</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => excluir(aviso.id)} disabled={processandoId === aviso.id}
                          style={{ background: 'rgba(192,57,43,0.12)', color: CORES_APP.erro, border: '1px solid rgba(192,57,43,0.3)', borderRadius: 7, padding: '7px 14px', fontSize: 12.5, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
                          {processandoId === aviso.id ? 'Excluindo...' : 'Sim, excluir'}
                        </button>
                        <button onClick={() => setConfirmandoExclusaoId(null)} disabled={processandoId === aviso.id}
                          style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 7, padding: '7px 14px', fontSize: 12.5, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </EstadoRequisicao>
      <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />
    </div>

    {modalAberto && (
      <PublicarAvisoModal
        avisoEmEdicao={editando}
        onFechar={() => { setModalAberto(false); setEditando(null) }}
        onSalvou={aoSalvarModal}
      />
    )}
    </>
  )
}

export default MuralAvisos
