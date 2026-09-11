import { useEffect, useState } from 'react'
import { estilos, CORES_APP, CORES_STATUS_SUGESTAO } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { buscarSugestoes } from '../services/forumService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { formatarDataHora } from '../utils/formatters'
import { IconPlus, IconMessageCircle } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import NovaSugestaoModal from './NovaSugestaoModal'
import Paginacao from './Paginacao'

// Listagem do Fórum de Sugestões — leitura e criação abertas pra qualquer
// usuário autenticado (colaborador ou técnico); mudar status é feito na
// tela de detalhe, só por técnico (ver ForumDetalheSugestao.jsx). Mesmo
// esqueleto de MuralAvisos.jsx: cabeçalho + botão de criar + lista de
// cards + paginação.
function ForumSugestoes({ onSelecionar }) {
  const { token, tratarErroApi } = useAuth()
  const [sugestoes, setSugestoes] = useState([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await buscarSugestoes(token, { pagina })
      setSugestoes(resposta.itens)
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
  }, [pagina])

  function aoCriar() {
    setModalAberto(false)
    setPagina(1)
    buscar()
  }

  // height:'100%' + coluna flex, mesma técnica de ITUsers.jsx — só a lista
  // rola por dentro, título/botão e paginação ficam sempre visíveis.
  return (
    <>
    <div className="animate-fade-up" style={{ maxWidth: 860, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div>
          <h1 style={estilos.sectionTitle}>Fórum de Sugestões</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Opiniões, ideias e sugestões de ajuste sobre o sistema</p>
        </div>
        <button onClick={() => setModalAberto(true)}
          style={{ ...estilos.btnPrimary, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}>
          <IconPlus width={15} height={15} /> Nova sugestão
        </button>
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {sugestoes.length === 0 ? (
          <div style={{ ...estilos.card, padding: 32, textAlign: 'center' }}>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Nenhuma sugestão publicada ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sugestoes.map(sugestao => {
              const cor = CORES_STATUS_SUGESTAO[sugestao.status]
              return (
                <button key={sugestao.id} onClick={() => onSelecionar(sugestao.id)}
                  style={{ ...estilos.card, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', display: 'block', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: cor.bg, color: cor.fg, border: `1px solid ${cor.borda}`, borderRadius: 99, padding: '3px 10px', fontSize: 11.5, fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                      {cor.label}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: CORES_APP.textoSuave, fontSize: 12.5, flexShrink: 0 }}>
                      <IconMessageCircle width={13} height={13} />
                      {sugestao.totalComentarios} {sugestao.totalComentarios === 1 ? 'comentário' : 'comentários'}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15.5, color: CORES_APP.tinta, margin: '10px 0 4px' }}>{sugestao.titulo}</h3>
                  <p style={{ color: CORES_APP.texto, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{sugestao.mensagem}</p>

                  <div style={{ color: CORES_APP.textoSuave, fontSize: 12 }}>
                    {sugestao.autor.nome ?? sugestao.autor.email} · {formatarDataHora(new Date(sugestao.criadaEm))}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </EstadoRequisicao>
      </div>
      <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />
    </div>

    {modalAberto && (
      <NovaSugestaoModal onFechar={() => setModalAberto(false)} onCriou={aoCriar} />
    )}
    </>
  )
}

export default ForumSugestoes
