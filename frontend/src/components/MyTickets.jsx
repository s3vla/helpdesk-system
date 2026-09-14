import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_STATUS, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { useListaCarregarMais } from '../hooks/useListaCarregarMais'
import { buscarMeusChamados } from '../services/ticketService'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import { formatarData } from '../utils/formatters'
import { LABEL_CATEGORIA } from '../utils/categorias'
import { numeroChamado } from '../utils/numeroChamado'
import { IconSearch } from './icons'

const COLUNAS = [
  { status: 'parado', label: 'Parado', cor: CORES_STATUS.parado.dot },
  { status: 'andamento', label: 'Em andamento', cor: CORES_STATUS.andamento.dot },
  { status: 'finalizado', label: 'Finalizado', cor: CORES_STATUS.finalizado.dot },
]

// Altura reservada acima da lista de cards de cada coluna (header fixo do
// app + título/busca da página + o próprio cabeçalho da coluna), pra que
// `calc(100vh - ALTURA_RESERVADA_COLUNA)` deixe só o card list rolando —
// uma coluna com muitos chamados nunca estica a página inteira pra baixo.
const ALTURA_RESERVADA_COLUNA = 300

// Kanban "Meus Chamados": busca os chamados do colaborador logado
// (GET /chamados/meus já filtra pelo usuário do token, nunca mostra
// chamados de outra pessoa) e agrupa por status em 3 colunas.
// `versaoDados` é incrementado pelo App.jsx toda vez que o TicketPanel muda
// algo (status, comentário) — é o gatilho pra essas 3 colunas recarregarem.
// Busca por texto (título/descrição) ou número do chamado — mesmo campo e
// mesmo debounce da Central de Chamados (ITDashboard.jsx), filtrando no
// backend, agora por coluna (GET /chamados/meus?busca=&status=).
//
// Cada coluna pagina de forma INDEPENDENTE via useListaCarregarMais — mais
// recentes primeiro, com "carregar mais" em vez de trazer o histórico
// inteiro (pensando em anos de chamados acumulados, principalmente em
// "Finalizado"). Isso substitui a paginação única de página inteira usada
// antes: com 3 colunas, uma "página" de resultados misturados se
// espalhava de forma arbitrária entre elas — paginar cada uma sozinha
// evita esse problema.
function MyTickets({ versaoDados, onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setBusca(buscaInput.trim()), 400)
    return () => clearTimeout(debounceRef.current)
  }, [buscaInput])

  function buscarColuna(status) {
    return async limite => {
      try {
        return await buscarMeusChamados(token, { busca, status, limite })
      } catch (e) {
        tratarErroApi(e)
        throw e
      }
    }
  }

  // Hooks sempre nas 3 mesmas posições (nunca dentro de COLUNAS.map) —
  // regra de hooks do React. `colunasEstado` só existe pra COLUNAS.map
  // conseguir olhar o estado de cada uma pelo `status` durante o render.
  const parado = useListaCarregarMais(buscarColuna('parado'), busca)
  const andamento = useListaCarregarMais(buscarColuna('andamento'), busca)
  const finalizado = useListaCarregarMais(buscarColuna('finalizado'), busca)
  const colunasEstado = { parado, andamento, finalizado }

  // `versaoDados` muda quando o TicketPanel altera algo (status, comentário,
  // atribuição) — recarrega as 3 colunas SILENCIOSAMENTE (mesma janela já
  // carregada, sem piscar "Carregando..."), porque a mudança pode ter
  // movido um chamado de coluna (ex: finalizar um "andamento").
  useEffect(() => {
    parado.recarregar()
    andamento.recarregar()
    finalizado.recarregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoDados])

  const carregandoGeral = parado.carregando || andamento.carregando || finalizado.carregando
  const totalGeral = parado.total + andamento.total + finalizado.total

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Meus chamados</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
            {carregandoGeral ? 'Carregando...' : `${totalGeral} chamado${totalGeral !== 1 ? 's' : ''} no total`}
          </p>
        </div>
        <div style={{ position: 'relative', flex: largura < 640 ? '1 1 100%' : '0 1 260px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, display: 'flex', pointerEvents: 'none' }}>
            <IconSearch width={14} height={14} />
          </span>
          <input value={buscaInput} onChange={e => setBuscaInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { clearTimeout(debounceRef.current); setBusca(buscaInput.trim()) } }}
            placeholder="Nº ou chamado"
            style={{ width: '100%', boxSizing: 'border-box', height: 36, padding: '0 12px 0 32px', background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, color: CORES_APP.tinta, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: largura < 640 ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {COLUNAS.map(coluna => {
          const estado = colunasEstado[coluna.status]
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
                {/* Contagem TOTAL da coluna (vem do backend, `total` do
                    envelope paginado) — continua certa mesmo quando só
                    uma fração dos itens foi carregada ("carregar mais"
                    ainda não usado). */}
                <span style={{ marginLeft: 'auto', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_APP.textoSuave }}>{estado.carregando ? '…' : estado.total}</span>
              </div>
              {/* Altura máxima fixa + rolagem interna PRÓPRIA da coluna
                  (overflowY aqui, não no container externo) — rolar uma
                  coluna cheia não move as outras nem a página, mesmo
                  padrão do histórico de comentários em TicketPanel.jsx
                  (cabeçalho fixo fora da área que rola, só o conteúdo
                  rola por baixo dele). "Carregar mais" fica DENTRO dessa
                  área, no fim da lista — rola até ele como qualquer card. */}
              <div style={{ maxHeight: `calc(100vh - ${ALTURA_RESERVADA_COLUNA}px)`, minHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {estado.carregando ? (
                  <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13 }}>Carregando...</div>
                ) : estado.erro && estado.itens.length === 0 ? (
                  <div style={{ padding: '18px 14px', textAlign: 'center', border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>
                    <p style={{ color: CORES_APP.erro, fontSize: 12.5, margin: '0 0 8px' }}>Não foi possível carregar.</p>
                    <button onClick={estado.tentarNovamente} style={{ ...estilos.btnGhost, padding: '6px 14px', fontSize: 12 }}>Tentar novamente</button>
                  </div>
                ) : estado.itens.length === 0 ? (
                  <div style={{ padding: '22px 14px', textAlign: 'center', color: CORES_APP.textoSuave, fontSize: 13, border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10 }}>Nenhum chamado</div>
                ) : (
                  <>
                    {estado.itens.map(chamado => (
                      <div key={chamado.id} onClick={() => onSelect(chamado)}
                        style={{ ...estilos.card, borderLeft: `3px solid ${coluna.cor}`, padding: '14px 15px', cursor: 'pointer', minWidth: 0, flexShrink: 0 }}>
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
                          <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category] ?? chamado.category}</span>
                          <span style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>{formatarData(chamado.created)}</span>
                        </div>
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
  )
}

export default MyTickets
