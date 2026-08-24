import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_STATUS, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { buscarMeusChamados } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import EstadoRequisicao from './EstadoRequisicao'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import { formatarData } from '../utils/formatters'
import { LABEL_CATEGORIA } from '../utils/categorias'
import { numeroChamado } from '../utils/numeroChamado'
import { IconSearch } from './icons'
import Paginacao from './Paginacao'

const COLUNAS = [
  { status: 'parado', label: 'Parado', cor: CORES_STATUS.parado.dot },
  { status: 'andamento', label: 'Em andamento', cor: CORES_STATUS.andamento.dot },
  { status: 'finalizado', label: 'Finalizado', cor: CORES_STATUS.finalizado.dot },
]

// Kanban "Meus Chamados": busca os chamados do colaborador logado
// (GET /chamados/meus já filtra pelo usuário do token, nunca mostra
// chamados de outra pessoa) e agrupa por status em 3 colunas.
// `versaoDados` é incrementado pelo App.jsx toda vez que o TicketPanel muda
// algo (status, comentário) — é o gatilho pra essa lista buscar de novo.
// Busca por texto (título/descrição) ou número do chamado — mesmo campo e
// mesmo debounce da Central de Chamados (ITDashboard.jsx), filtrando no
// backend (GET /chamados/meus?busca=) em vez de em memória. Como aqui não
// existe filtro de status pra restringir antes (as 3 colunas já aparecem
// juntas sempre), a busca cobre Parado/Em andamento/Finalizado ao mesmo
// tempo, sem precisar trocar de aba nenhuma.
function MyTickets({ versaoDados, onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const [chamados, setChamados] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setBusca(buscaInput.trim()), 400)
    return () => clearTimeout(debounceRef.current)
  }, [buscaInput])

  // Toda vez que a busca muda, volta pra página 1 — senão dá pra ficar
  // "presa" numa página 4 que não existe mais depois de um filtro que
  // reduziu o total de resultados.
  useEffect(() => {
    setPagina(1)
  }, [busca])

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarMeusChamados(token, { busca, pagina })
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
  }, [versaoDados, busca, pagina])

  function aoPressionarEnterNaBusca(e) {
    if (e.key !== 'Enter') return
    clearTimeout(debounceRef.current)
    setBusca(buscaInput.trim())
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Meus chamados</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
            {carregando ? 'Carregando...' : `${total} chamado${total !== 1 ? 's' : ''} no total`}
          </p>
        </div>
        <div style={{ position: 'relative', flex: largura < 640 ? '1 1 100%' : '0 1 260px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, display: 'flex', pointerEvents: 'none' }}>
            <IconSearch width={14} height={14} />
          </span>
          <input value={buscaInput} onChange={e => setBuscaInput(e.target.value)} onKeyDown={aoPressionarEnterNaBusca}
            placeholder="Nº ou chamado"
            style={{ width: '100%', boxSizing: 'border-box', height: 36, padding: '0 12px 0 32px', background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, color: CORES_APP.tinta, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
        </div>
      </div>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        <div style={{ display: 'grid', gridTemplateColumns: largura < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {COLUNAS.map(coluna => {
            const cards = chamados.filter(c => c.status === coluna.status)
            // minWidth:0 é o que impede um título sem espaço nenhum de
            // forçar a TRACK da grid (repeat(3, 1fr)) a crescer além do
            // 1/3 — por padrão, um item de grid tem min-width:auto
            // implícito, que respeita a largura mínima do CONTEÚDO (não
            // do container), e um texto sem onde quebrar vira exatamente
            // esse mínimo. Sem isso, a coluna inteira espremia as outras
            // duas pra caber a palavra comprida.
            return (
              <div key={coluna.status} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: CORES_APP.fundoCampo, borderRadius: 10, border: `1px solid ${coluna.cor}30` }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: coluna.cor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: coluna.cor }}>{coluna.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_APP.textoSuave }}>{cards.length}</span>
                </div>
                {cards.length === 0
                  ? <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13, border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>Nenhum chamado</div>
                  : cards.map(chamado => (
                    <div key={chamado.id} onClick={() => onSelect(chamado)}
                      style={{ ...estilos.card, borderLeft: `3px solid ${coluna.cor}`, padding: '14px 15px', cursor: 'pointer', minWidth: 0 }}>
                      {/* Título truncado em no máximo 2 linhas (line-clamp)
                          — um resumo sem espaço nenhum (ex: colado sem
                          querer) não tem onde quebrar e antes estourava a
                          largura do card, empurrando categoria/data/badge
                          pra fora e desalinhando a grid inteira. Com altura
                          de título sempre previsível (1 ou 2 linhas), os
                          cards da mesma coluna também ficam consistentes
                          entre si — o resto do card (categoria, data,
                          badge) sempre no mesmo lugar. */}
                      <div style={{
                        fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: CORES_APP.tinta, marginBottom: 8, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'break-word',
                      }}>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, fontSize: 12, color: CORES_APP.textoSuave, marginRight: 6 }}>{numeroChamado(chamado.id)}</span>
                        {chamado.summary}
                      </div>
                      {chamado.status === 'andamento' && chamado.aguardandoRespostaDe && (
                        <div style={{ marginBottom: 8 }}>
                          <AguardandoRespostaBadge status={chamado.status} aguardandoRespostaDe={chamado.aguardandoRespostaDe} isIT={false} />
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category]}</span>
                        <span style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>{formatarData(chamado.created)}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )
          })}
        </div>
      </EstadoRequisicao>
      <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />
    </div>
  )
}

export default MyTickets
