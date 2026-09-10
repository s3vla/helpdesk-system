import { useEffect, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { obterIniciais } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import { buscarColaboradores, buscarChamadosDoColaborador } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import EstadoRequisicao from './EstadoRequisicao'
import Paginacao from './Paginacao'

// Lista de colaboradores cadastrados, com contagem de chamados por pessoa.
// A API não devolve essa contagem pronta, então buscamos os chamados de
// cada colaborador em paralelo (Promise.all) depois de carregar a lista —
// tranquilo para o tamanho de equipe desse sistema; se a lista de
// colaboradores crescesse muito, isso viraria candidato a um endpoint de
// resumo no backend.
// 20 (era 10, o padrão da API) só pra esta tela — passado explicitamente
// pro backend via `porPagina`, sem mexer no LIMITE_PADRAO compartilhado
// por Meus Chamados/Minhas Tarefas/etc.
const COLABORADORES_POR_PAGINA = 20

function ITUsers({ onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [contagens, setContagens] = useState({})
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarColaboradores(token, { pagina, porPagina: COLABORADORES_POR_PAGINA })
      const lista = resposta.itens
      setUsuarios(lista)
      setTotal(resposta.total)
      setTotalPaginas(resposta.totalPaginas)
      // Só busca o histórico de chamados de quem está NESTA página — a
      // API de trás (GET /usuarios/:id/chamados) continua sem paginação
      // própria de propósito (essas contagens têm que ser exatas), mas não
      // faz sentido buscar isso pra colaboradores de outras páginas que
      // nem estão sendo mostrados agora.
      const listasDeChamados = await Promise.all(lista.map(u => buscarChamadosDoColaborador(token, u.id)))
      const novasContagens = {}
      lista.forEach((u, indice) => {
        const chamadosDoUsuario = listasDeChamados[indice]
        novasContagens[u.id] = {
          total: chamadosDoUsuario.length,
          abertos: chamadosDoUsuario.filter(c => c.status !== 'finalizado').length,
          finalizados: chamadosDoUsuario.filter(c => c.status === 'finalizado').length,
        }
      })
      setContagens(novasContagens)
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

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 26 }}>
        <h1 style={estilos.sectionTitle}>Colaboradores</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
          {carregando ? 'Carregando...' : `${total} colaboradores cadastrados`}
        </p>
      </div>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {/* auto-fit (não auto-fill): com poucos colaboradores na página,
            auto-fill reservava colunas "fantasmas" vazias até o fim da
            linha (cada uma ainda ocupando 1fr de largura, só que sem
            conteúdo) — sobrava um vão em branco à direita mesmo a página
            tendo espaço de sobra. auto-fit colapsa as colunas sem
            conteúdo a 0, deixando os cards que existem esticarem (1fr)
            pra preencher a linha toda de verdade. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {usuarios.map(usuario => {
            const c = contagens[usuario.id] ?? { total: 0, abertos: 0, finalizados: 0 }
            return (
              <div key={usuario.id} onClick={() => onSelect(usuario)}
                style={{ ...estilos.card, padding: '20px', cursor: 'pointer', opacity: usuario.emAguardoDeCadastro ? 0.7 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: usuario.emAguardoDeCadastro ? CORES_APP.fundoCampo : '#007851', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0 }}>
                    {usuario.emAguardoDeCadastro ? '?' : obterIniciais(usuario.name)}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: usuario.emAguardoDeCadastro ? CORES_APP.textoFraco : CORES_APP.tinta }}>
                      {usuario.emAguardoDeCadastro ? usuario.email : usuario.name}
                    </div>
                    {usuario.emAguardoDeCadastro ? (
                      <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'inline-block', marginTop: 3 }}>
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
                    ['Abertos', c.abertos, c.abertos > 0 ? '#f59e0b' : CORES_APP.textoSuave],
                    ['Finalizados', c.finalizados, '#22c55e'],
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
      </EstadoRequisicao>
      <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />
    </div>
  )
}

export default ITUsers
