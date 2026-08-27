import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { useListaCarregarMais } from '../hooks/useListaCarregarMais'
import { buscarAnotacoes } from '../services/anotacoesService'
import { formatarDataHora } from '../utils/formatters'
import { IconPlus } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import AnotacaoModal from './AnotacaoModal'
import NotaFlutuante from './NotaFlutuante'

const LARGURA_JANELA = 300
const CASCATA = 28

// "Minhas Anotações" — bloco de notas de texto livre, SEM nenhuma relação
// com Chamado nem com Tarefa (feature separada, ver pedido). Cada usuário
// só vê/mexe nas próprias (GET /anotacoes já filtra pelo token).
//
// Lista paginada via useListaCarregarMais — mais recentes primeiro, com
// "carregar mais" em vez de trazer o histórico inteiro de uma vez
// (pensando em anos de anotações acumuladas, mesmo raciocínio de Meus
// Chamados/Minhas Tarefas). Sem coluna/status aqui (é uma grade só), então
// uma única instância do hook basta.
//
// Clicar num card da lista abre uma "janela flutuante" (NotaFlutuante),
// arrastável e independente — várias podem ficar abertas ao mesmo tempo.
// `janelas` guarda {id, x, y, z} de ABERTURA: a posição durante o arraste
// vive em estado local de cada NotaFlutuante, não aqui (senão cada pixel
// arrastado re-renderizaria todas as outras janelas abertas). `z` é o
// zIndex — trazer pra frente só incrementa esse número, NUNCA reordena o
// array (ver comentário em trazerParaFrente).
function MinhasAnotacoes() {
  const { token, tratarErroApi } = useAuth()
  const largura = useWindowWidth()
  const proximoZRef = useRef(300)
  const [modalAberto, setModalAberto] = useState(false)
  const [janelas, setJanelas] = useState([])

  async function buscarPagina(limite) {
    try {
      return await buscarAnotacoes(token, { limite })
    } catch (e) {
      tratarErroApi(e)
      throw e
    }
  }

  const lista = useListaCarregarMais(buscarPagina, 'anotacoes')

  // Se uma anotação some da lista (excluída, seja pela janela flutuante ou
  // por qualquer outro caminho), fecha a janela dela também.
  useEffect(() => {
    setJanelas(atuais => atuais.filter(j => lista.itens.some(a => a.id === j.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista.itens])

  function aoSalvarModal() {
    setModalAberto(false)
    lista.recarregar()
  }

  function proximoZ() {
    proximoZRef.current += 1
    return proximoZRef.current
  }

  function abrirJanela(anotacao, evento) {
    setJanelas(atuais => {
      const jaAberta = atuais.find(j => j.id === anotacao.id)
      if (jaAberta) return atuais.map(j => (j.id === anotacao.id ? { ...j, z: proximoZ() } : j))

      const indiceCascata = atuais.length % 6
      const baseX = evento.clientX - LARGURA_JANELA / 3
      const baseY = evento.clientY - 20
      const x = Math.min(Math.max(baseX + indiceCascata * CASCATA, 12), window.innerWidth - LARGURA_JANELA - 12)
      const y = Math.min(Math.max(baseY + indiceCascata * CASCATA, 12), window.innerHeight - 140)
      return [...atuais, { id: anotacao.id, x, y, z: proximoZ() }]
    })
  }

  function fecharJanela(id) {
    setJanelas(atuais => atuais.filter(j => j.id !== id))
  }

  // Só muda o campo `z` (zIndex) do item — NUNCA reordena o array. Reordenar
  // faria o React mover o nó da janela pra outra posição entre os irmãos no
  // DOM, e se isso acontecer NO MEIO de um clique (ex: mousedown num botão
  // dentro da própria janela, que também traz ela pra frente), o navegador
  // descarta o clique porque o elemento sob o ponteiro mudou de lugar antes
  // do mouseup — foi reproduzido via Playwright: cliques em "Recolher",
  // "Editar" e "Fechar" simplesmente paravam de disparar depois de qualquer
  // reordenação anterior. Empilhamento visual (z-index) não precisa de
  // ordem no DOM pra funcionar, então manter a ordem do array fixa resolve
  // sem perder o comportamento de "trazer pra frente".
  function trazerParaFrente(id) {
    setJanelas(atuais => atuais.map(j => (j.id === id ? { ...j, z: proximoZ() } : j)))
  }

  return (
    <>
    <div className="animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 24 : 28, color: CORES_APP.tinta, margin: '0 0 6px' }}>Minhas Anotações</h1>
          <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
            {lista.carregando ? 'Carregando...' : `${lista.total} anotaç${lista.total !== 1 ? 'ões' : 'ão'}`} — clique numa para abrir.
          </p>
        </div>
        <button onClick={() => setModalAberto(true)}
          style={{ ...estilos.btnPrimary, width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}>
          <IconPlus width={15} height={15} /> Nova anotação
        </button>
      </div>

      <EstadoRequisicao carregando={lista.carregando} erro={lista.erro ? 'Não foi possível carregar as anotações.' : ''} aoTentarNovamente={lista.tentarNovamente}>
        {lista.itens.length === 0 ? (
          <div style={{ ...estilos.card, padding: 32, textAlign: 'center' }}>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Nenhuma anotação ainda.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {lista.itens.map(anotacao => (
                <div key={anotacao.id} onClick={e => abrirJanela(anotacao, e)}
                  style={{ ...estilos.card, padding: '14px 15px', display: 'flex', flexDirection: 'column', minWidth: 0, cursor: 'pointer' }}>
                  <p style={{
                    color: CORES_APP.texto, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
                    display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1,
                  }}>
                    {anotacao.conteudo}
                  </p>
                  <span style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>{formatarDataHora(new Date(anotacao.atualizadaEm))}</span>
                </div>
              ))}
            </div>
            {lista.temMais && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                <button onClick={lista.carregarMais} disabled={lista.carregandoMais}
                  style={{ ...estilos.btnGhost, padding: '10px 22px', fontSize: 13, opacity: lista.carregandoMais ? 0.7 : 1, cursor: lista.carregandoMais ? 'default' : 'pointer' }}>
                  {lista.carregandoMais ? 'Carregando...' : `Carregar mais (${lista.total - lista.itens.length} restantes)`}
                </button>
              </div>
            )}
          </>
        )}
      </EstadoRequisicao>
    </div>

    {modalAberto && (
      <AnotacaoModal
        anotacaoEmEdicao={null}
        onFechar={() => setModalAberto(false)}
        onSalvou={aoSalvarModal}
      />
    )}

    {janelas.map(janela => (
      <NotaFlutuante
        key={janela.id}
        id={janela.id}
        anotacao={lista.itens.find(a => a.id === janela.id)}
        posicaoInicial={{ x: janela.x, y: janela.y }}
        zIndex={janela.z}
        aoFechar={fecharJanela}
        aoFocar={trazerParaFrente}
        aoMudou={lista.recarregar}
      />
    ))}
    </>
  )
}

export default MinhasAnotacoes
