import { useEffect, useState } from 'react'
import { estilos, CORES_STATUS, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { buscarChamadosObservando } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import EstadoRequisicao from './EstadoRequisicao'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import { formatarData } from '../utils/formatters'
import { LABEL_CATEGORIA } from '../utils/categorias'
import { numeroChamado } from '../utils/numeroChamado'
import Paginacao from './Paginacao'

const COLUNAS = [
  { status: 'parado', label: 'Parado', cor: CORES_STATUS.parado.dot },
  { status: 'andamento', label: 'Em andamento', cor: CORES_STATUS.andamento.dot },
  { status: 'finalizado', label: 'Finalizado', cor: CORES_STATUS.finalizado.dot },
]

// "Acompanhando": chamados onde o colaborador foi adicionado como
// observador ("Cc") por um técnico — SEPARADO de "Meus chamados"
// (GET /chamados/observando nunca mistura com GET /chamados/meus, mesmo
// que o mesmo chamado nunca apareça nas duas por definição: quem abriu não
// pode também ser observador do próprio chamado). Mesmo layout Kanban de
// MyTickets.jsx, só a fonte dos dados muda.
function AcompanhandoTickets({ versaoDados, onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const [chamados, setChamados] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarChamadosObservando(token, pagina)
      setChamados(resposta.itens)
      setTotal(resposta.total)
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
  }, [versaoDados, pagina])

  // height:'100%' + coluna flex, mesma técnica de ITUsers.jsx/
  // TicketPanel.jsx: só o bloco do meio (EstadoRequisicao + kanban) rola
  // por dentro (flex:'1 1 auto' + minHeight:0); título e paginação ficam
  // fora, sempre visíveis.
  return (
    <div className="animate-fade-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 28, flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Acompanhando</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
          {carregando ? 'Carregando...' : `${total} chamado${total !== 1 ? 's' : ''} onde você foi incluído como Cc`}
        </p>
      </div>
      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {chamados.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 14 }}>
            Você ainda não foi adicionado para acompanhar nenhum chamado.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: largura < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            {COLUNAS.map(coluna => {
              const cards = chamados.filter(c => c.status === coluna.status)
              // minWidth:0 — sem isso, um título sem espaço nenhum força
              // a track da grid (repeat(3, 1fr)) a crescer além do 1/3,
              // desalinhando as 3 colunas (mesma correção de
              // MyTickets.jsx, que usa este exato layout).
              return (
                <div key={coluna.status} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: CORES_APP.fundoCampo, borderRadius: 10, border: `1px solid color-mix(in srgb, ${coluna.cor} 19%, transparent)` }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: coluna.cor, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: coluna.cor }}>{coluna.label}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_APP.textoSuave }}>{cards.length}</span>
                  </div>
                  {cards.length === 0
                    ? <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13, border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>Nenhum chamado</div>
                    : cards.map(chamado => (
                      <div key={chamado.id} onClick={() => onSelect(chamado)}
                        style={{ ...estilos.card, borderLeft: `3px solid ${coluna.cor}`, padding: '14px 15px', cursor: 'pointer', minWidth: 0 }}>
                        {/* Título truncado em no máximo 2 linhas (mesma
                            correção de MyTickets.jsx) — sem isso, um
                            resumo sem espaço nenhum estourava a largura do
                            card, empurrando "Aberto por"/categoria/data
                            pra fora e desalinhando a grid inteira. */}
                        <div style={{
                          fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: CORES_APP.tinta, marginBottom: 4, lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'break-word',
                        }}>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, fontSize: 12, color: CORES_APP.textoSuave, marginRight: 6 }}>{numeroChamado(chamado.id)}</span>
                          {chamado.summary}
                        </div>
                        <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginBottom: 8 }}>Aberto por {chamado.solicitanteNome ?? '(conta resetada)'}</div>
                        {chamado.status === 'andamento' && chamado.aguardandoRespostaDe && (
                          <div style={{ marginBottom: 8 }}>
                            <AguardandoRespostaBadge status={chamado.status} aguardandoRespostaDe={chamado.aguardandoRespostaDe} isIT={false} />
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category] ?? chamado.category}</span>
                          <span style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>{formatarData(chamado.created)}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )
            })}
          </div>
        )}
      </EstadoRequisicao>
      </div>
      <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />
    </div>
  )
}

export default AcompanhandoTickets
