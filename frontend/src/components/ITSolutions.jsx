import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { formatarData } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import { buscarSolucoesConhecidas } from '../services/ticketService'
import { buscarCategoriasAtivas } from '../services/categoriasService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { URL_BASE } from '../services/apiClient'
import { LABEL_CATEGORIA as LABEL_CATEGORIA_BASE } from '../utils/categorias'
import { IconBarChart, IconSearch, IconChevronDown } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import ImageLightbox from './ImageLightbox'
import Paginacao from './Paginacao'

const LABEL_CATEGORIA = { all: 'Todas', ...LABEL_CATEGORIA_BASE }

// Base de "Soluções Conhecidas": busca as soluções catalogadas
// (GET /solucoes-conhecidas já filtra por marcadaComo=true no backend).
// Busca por palavra-chave e filtro de categoria agora vão pro backend
// (querystring), em vez de filtrar em memória sobre a lista inteira — só
// funcionava assim enquanto a lista inteira era carregada de uma vez;
// paginada, a busca precisava valer pra TODAS as páginas, não só pra que
// já tinha sido baixada. `contagensPorCategoria` (por aba) também vem
// pronto do backend pelo mesmo motivo — ver ticketService.buscarSolucoesConhecidas.
function ITSolutions() {
  const { token, tratarErroApi } = useAuth()
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  // Categorias ativas buscadas do backend (não mais um array fixo) — uma
  // categoria nova criada em Administração aparece aqui sem precisar de
  // deploy nenhum.
  const [categorias, setCategorias] = useState(['all'])
  const [solucoes, setSolucoes] = useState([])
  const [total, setTotal] = useState(0)
  const [contagensPorCategoria, setContagensPorCategoria] = useState({})
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [imagemAmpliada, setImagemAmpliada] = useState(null)
  // Accordion — só uma solução expandida por vez (guarda o id, não um
  // Set): clicar num card fechado abre ele e fecha qualquer outro que
  // estivesse aberto; clicar no já aberto fecha.
  const [expandidaId, setExpandidaId] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setBusca(buscaInput.trim()), 400)
    return () => clearTimeout(debounceRef.current)
  }, [buscaInput])

  useEffect(() => {
    buscarCategoriasAtivas(token)
      .then(lista => setCategorias(['all', ...lista.map(c => c.nome)]))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Busca ou categoria mudando volta pra página 1 — senão dá pra ficar
  // "presa" numa página que não existe mais depois de um filtro que
  // reduziu o total de resultados.
  useEffect(() => {
    setPagina(1)
    setExpandidaId(null)
  }, [busca, filtroCategoria])

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarSolucoesConhecidas(token, { busca, categoria: filtroCategoria, pagina })
      setSolucoes(resposta.itens)
      setTotal(resposta.total)
      setContagensPorCategoria(resposta.contagensPorCategoria)
      setTotalPaginas(resposta.totalPaginas)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, filtroCategoria, pagina])

  function aoPressionarEnterNaBusca(e) {
    if (e.key !== 'Enter') return
    clearTimeout(debounceRef.current)
    setBusca(buscaInput.trim())
  }

  // height:'100%' + coluna flex, mesma técnica de ITUsers.jsx — título,
  // busca e filtros ficam fixos no topo; só a lista rola por dentro.
  return (
    <div className="animate-fade-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 26, flexShrink: 0 }}>
        <h1 style={estilos.sectionTitle}>Soluções Conhecidas</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
          {carregando ? 'Carregando...' : `${total} solução${total !== 1 ? 'ões' : ''} catalogada${total !== 1 ? 's' : ''} — pesquise antes de começar a resolver um chamado novo`}
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: 18, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, pointerEvents: 'none', display: 'flex' }}><IconSearch /></span>
        <input
          value={buscaInput} onChange={e => setBuscaInput(e.target.value)} onKeyDown={aoPressionarEnterNaBusca}
          placeholder="Pesquisar por palavra-chave — ex: impressora, VPN, acesso..."
          style={{ ...estilos.input, paddingLeft: 40, fontSize: 14 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', flexShrink: 0 }}>
        {categorias.map(c => {
          const contagem = c === 'all'
            ? Object.values(contagensPorCategoria).reduce((soma, n) => soma + n, 0)
            : contagensPorCategoria[c] ?? 0
          const ativo = filtroCategoria === c
          return (
            <button key={c} onClick={() => setFiltroCategoria(c)}
              style={{ background: ativo ? 'rgba(34,197,94,0.12)' : CORES_APP.fundoCampo, color: ativo ? '#007851' : CORES_APP.textoFraco, border: `1px solid ${ativo ? 'rgba(34,197,94,0.3)' : CORES_APP.borda}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: ativo ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {LABEL_CATEGORIA[c] ?? c}
              <span style={{ background: ativo ? 'rgba(34,197,94,0.2)' : CORES_APP.fundoCampo, color: ativo ? '#007851' : CORES_APP.textoSuave, borderRadius: 99, padding: '1px 7px', fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{contagem}</span>
            </button>
          )
        })}
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {solucoes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ color: CORES_APP.textoSuave, marginBottom: 14, display: 'flex', justifyContent: 'center' }}><IconSearch width={36} height={36} /></div>
            <div style={{ color: CORES_APP.textoFraco, fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Nenhuma solução encontrada</div>
            <div style={{ color: CORES_APP.textoSuave, fontSize: 14 }}>{busca ? `Nenhum resultado para "${busca}"` : 'Nenhuma solução conhecida nesta categoria ainda'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {solucoes.map(chamado => {
              const ocorrencias = chamado.ocorrenciasCategoria ?? 1
              const expandida = expandidaId === chamado.id
              return (
                <div key={chamado.id} style={{ ...estilos.card, border: '1px solid rgba(34,197,94,0.14)', borderLeft: '3px solid #22c55e', overflow: 'hidden' }}>
                  {/* Card compacto por padrão (título + resumo de 1 linha) —
                      clique em qualquer parte do cabeçalho expande/recolhe.
                      Accordion: abrir um fecha qualquer outro já aberto
                      (ver setExpandidaId). */}
                  <button type="button" onClick={() => setExpandidaId(expandida ? null : chamado.id)}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, padding: '2px 9px', borderRadius: 99, fontSize: 10.5, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category] ?? chamado.category}</span>
                        <span style={{ background: 'rgba(34,197,94,0.12)', color: '#007851', padding: '2px 9px', borderRadius: 99, fontSize: 10.5, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Solução conhecida</span>
                      </div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: CORES_APP.tinta, margin: 0, lineHeight: 1.4 }}>{chamado.summary}</h3>
                      {!expandida && (
                        <p style={{ color: CORES_APP.textoFraco, fontSize: 12.5, margin: '3px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chamado.resolution.text}
                        </p>
                      )}
                    </div>
                    <IconChevronDown width={16} height={16} style={{ color: CORES_APP.textoSuave, flexShrink: 0, transform: expandida ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>

                  {expandida && (
                    <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconBarChart width={13} height={13} /> {ocorrencias} ocorrência{ocorrencias !== 1 ? 's' : ''} em {LABEL_CATEGORIA[chamado.category] ?? chamado.category}
                        </span>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>Resolvido em</div>
                          <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginTop: 2 }}>{formatarData(chamado.resolution.resolvedAt)}</div>
                          <div style={{ color: CORES_APP.textoSuave, fontSize: 11, marginTop: 2 }}>por {chamado.resolution.resolvedBy}</div>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'rgba(34,197,94,0.1)' }} />

                      <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{chamado.description}</p>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>✓</span>
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 12, color: '#007851', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Como foi resolvido</span>
                        </div>
                        <p style={{ color: CORES_APP.texto, fontSize: 14, margin: 0, lineHeight: 1.75, background: 'rgba(34,197,94,0.04)', borderRadius: 8, padding: '12px 14px', border: '1px solid rgba(34,197,94,0.1)', whiteSpace: 'pre-wrap' }}>
                          {chamado.resolution.text}
                        </p>
                      </div>

                      {chamado.resolution.imagens.length > 0 && (
                        <div style={{ background: CORES_APP.fundoCampo, border: '1px solid rgba(0,120,81,0.14)', borderRadius: 10, padding: 14 }}>
                          <div style={estilos.label}>{chamado.resolution.imagens.length > 1 ? `Prints anexados (${chamado.resolution.imagens.length})` : 'Print anexado'}</div>
                          {/* Mesma galeria de TicketPanel.jsx: uma imagem só
                              vira preview grande, mais de uma vira grade de
                              miniaturas — cada uma abre no mesmo lightbox. */}
                          {chamado.resolution.imagens.length === 1 ? (
                            <img src={`${URL_BASE}${chamado.resolution.imagens[0]}`} alt="Print da solução" onClick={() => setImagemAmpliada(`${URL_BASE}${chamado.resolution.imagens[0]}`)}
                              style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, display: 'block', cursor: 'zoom-in' }} />
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {chamado.resolution.imagens.map((url, indice) => (
                                <img key={url} src={`${URL_BASE}${url}`} alt={`Print da solução ${indice + 1}`} onClick={() => setImagemAmpliada(`${URL_BASE}${url}`)}
                                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in' }} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </EstadoRequisicao>
      </div>
      <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />

      <ImageLightbox src={imagemAmpliada} alt="Imagem ampliada" onClose={() => setImagemAmpliada(null)} />
    </div>
  )
}

export default ITSolutions
