import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_APP, CORES_STATUS, CORES_PRIORIDADE, CORES_TI } from '../styles/theme'
import { cores } from '../styles/authTheme'
import { obterIniciais } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import { buscarColaboradores } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import EstadoRequisicao from './EstadoRequisicao'
import Paginacao from './Paginacao'
import { IconSearch } from './icons'

// Lista de colaboradores cadastrados, com contagem de chamados por pessoa.
// A própria resposta de GET /usuarios já vem com essas contagens embutidas
// (totalChamados/chamadosAbertos/chamadosFinalizados, calculadas numa
// query agrupada só no backend) — não busca mais o histórico de cada
// colaborador separado (era 1 requisição POR linha da lista, um padrão N+1
// que gerava requisição de sobra suficiente pra estourar o rate limit
// global só de abrir esta tela com volume normal de gente cadastrada).
// 20 (era 10, o padrão da API) só pra esta tela — passado explicitamente
// pro backend via `porPagina`, sem mexer no LIMITE_PADRAO compartilhado
// por Meus Chamados/Minhas Tarefas/etc.
const COLABORADORES_POR_PAGINA = 20

// Mesmo padrão de pílulas de ITDashboard.jsx (FILTROS_STATUS) — reaproveita
// as mesmas chaves minúsculas e CORES_STATUS, pra ficar visualmente
// idêntico ao filtro de status já existente na Central de Chamados.
const FILTROS_STATUS = [['all', 'Todos'], ['parado', 'Parados'], ['andamento', 'Em andamento'], ['finalizado', 'Finalizados']]

function ITUsers({ onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('all')
  const debounceRef = useRef(null)

  // Mesmo debounce de ~300-400ms já usado em ITSolutions.jsx pra busca —
  // espera parar de digitar antes de disparar a requisição.
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setBusca(buscaInput.trim()), 300)
    return () => clearTimeout(debounceRef.current)
  }, [buscaInput])

  // Busca ou filtro de status mudando volta pra página 1 — senão dá pra
  // ficar "presa" numa página que não existe mais depois de um filtro que
  // reduziu o total de resultados (mesmo raciocínio de ITSolutions.jsx).
  useEffect(() => {
    setPagina(1)
  }, [busca, filtroStatus])

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarColaboradores(token, {
        pagina, porPagina: COLABORADORES_POR_PAGINA, busca,
        statusChamado: filtroStatus !== 'all' ? filtroStatus : undefined,
      })
      setUsuarios(resposta.itens)
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
  }, [pagina, busca, filtroStatus])

  // height:'100%' + coluna flex: o wrapper assume TODO o espaço vertical
  // que o `main` do layout já reserva (ver EmployeeLayout.jsx/
  // ITLayout.jsx), em vez de crescer com o conteúdo. Só o bloco do meio
  // (EstadoRequisicao + grid) rola por dentro — `flex:'1 1 auto'` +
  // `minHeight:0` é o que permite o overflow funcionar dentro de uma
  // coluna flex (mesma técnica de TicketPanel.jsx). Título e paginação
  // ficam FORA dessa área, sempre visíveis, nunca soterrados pelo scroll.
  return (
    <div className="animate-fade-up" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={estilos.sectionTitle}>Colaboradores</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
          {carregando ? 'Carregando...' : `${total} colaborador${total !== 1 ? 'es' : ''} ${busca ? 'encontrado' + (total !== 1 ? 's' : '') : 'cadastrado' + (total !== 1 ? 's' : '')}`}
        </p>
      </div>
      <div style={{ position: 'relative', marginBottom: 14, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, pointerEvents: 'none', display: 'flex' }}><IconSearch /></span>
        <input
          value={buscaInput} onChange={e => setBuscaInput(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          style={{ ...estilos.input, paddingLeft: 40, fontSize: 14 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18, flexShrink: 0 }}>
        <span style={{ color: CORES_APP.textoSuave, fontFamily: 'Outfit, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 2 }}>Status:</span>
        {FILTROS_STATUS.map(([valor, label]) => {
          const ativo = filtroStatus === valor
          const cor = valor !== 'all' ? CORES_STATUS[valor].fg : CORES_TI.accent
          return (
            <button key={valor} type="button" onClick={() => setFiltroStatus(valor)}
              style={{
                background: ativo ? `color-mix(in srgb, ${cor} 10%, transparent)` : CORES_APP.fundoCampo,
                color: ativo ? cor : CORES_APP.textoFraco,
                border: `1px solid ${ativo ? `color-mix(in srgb, ${cor} 27%, transparent)` : CORES_APP.borda}`,
                borderRadius: 999, padding: '6px 13px', fontSize: 12, fontFamily: 'Outfit, sans-serif',
                fontWeight: ativo ? 600 : 400, cursor: 'pointer',
              }}>
              {label}
            </button>
          )
        })}
      </div>
      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {!carregando && usuarios.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ color: CORES_APP.textoSuave, marginBottom: 14, display: 'flex', justifyContent: 'center' }}><IconSearch width={36} height={36} /></div>
            <div style={{ color: CORES_APP.textoFraco, fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Nenhum colaborador encontrado</div>
            {busca && <div style={{ color: CORES_APP.textoSuave, fontSize: 14 }}>Nenhum resultado para &quot;{busca}&quot;</div>}
          </div>
        ) : (
        // auto-fit (não auto-fill): com poucos colaboradores na página,
        // auto-fill reservava colunas "fantasmas" vazias até o fim da
        // linha (cada uma ainda ocupando 1fr de largura, só que sem
        // conteúdo) — sobrava um vão em branco à direita mesmo a página
        // tendo espaço de sobra. auto-fit colapsa as colunas sem
        // conteúdo a 0, deixando os cards que existem esticarem pra
        // preencher a linha toda de verdade.
        // Teto de 380px (não 1fr) no minmax — com 1fr, a ÚNICA coluna
        // que sobra na última página (ex: resto de 1 item) vira 100% da
        // largura da linha inteira, um card enorme e desproporcional.
        // Com um teto fixo, o card ainda estica pra preencher espaço
        // vazio quando faz sentido, mas nunca passa de um tamanho de
        // card razoável, sozinho ou acompanhado. justifyContent:'start'
        // (não 'center') mantém os cards alinhados à esquerda — mesmo
        // com um item sobrando sozinho na última página, ele fica no
        // canto esquerdo como qualquer outro card, não centralizado.
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 380px))', gap: 18, justifyContent: 'start' }}>
          {usuarios.map(usuario => {
            const c = {
              total: usuario.totalChamados ?? 0,
              abertos: usuario.chamadosAbertos ?? 0,
              finalizados: usuario.chamadosFinalizados ?? 0,
            }
            return (
              <div key={usuario.id} onClick={() => onSelect(usuario)}
                style={{ ...estilos.card, padding: '20px', cursor: 'pointer', opacity: usuario.emAguardoDeCadastro ? 0.7 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: usuario.emAguardoDeCadastro ? CORES_APP.fundoCampo : cores.verdeEscuro, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                    {usuario.emAguardoDeCadastro ? '?' : obterIniciais(usuario.name)}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: usuario.emAguardoDeCadastro ? CORES_APP.textoFraco : CORES_APP.tinta }}>
                      {usuario.emAguardoDeCadastro ? usuario.email : usuario.name}
                    </div>
                    {usuario.emAguardoDeCadastro ? (
                      <span style={{ background: CORES_STATUS.andamento.bg, color: CORES_STATUS.andamento.fg, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'inline-block', marginTop: 3 }}>
                        Aguardando novo cadastro
                      </span>
                    ) : (
                      <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginTop: 1 }}>{usuario.role}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${CORES_APP.bordaSuave}`, paddingTop: 14, gap: 4 }}>
                  {[
                    ['Total', c.total, CORES_APP.tinta],
                    ['Abertos', c.abertos, c.abertos > 0 ? CORES_STATUS.andamento.fg : CORES_APP.textoSuave],
                    ['Finalizados', c.finalizados, CORES_PRIORIDADE.baixa.dot],
                  ].map(([label, valor, cor]) => (
                    <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: cor, lineHeight: 1 }}>{valor}</div>
                      <div style={{ color: CORES_APP.textoSuave, fontSize: 11, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, color: CORES_APP.textoSuave, fontSize: 12, borderTop: `1px solid ${CORES_APP.bordaSuave}`, paddingTop: 10 }}>{usuario.dept}</div>
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

export default ITUsers
