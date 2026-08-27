import { useCallback, useEffect, useRef, useState } from 'react'

const INCREMENTO_PADRAO = 10

// Gerencia uma lista "carregar mais" (mais recentes primeiro, sem
// paginação por número de página visível pro usuário) — usado nas colunas
// de Kanban que podem crescer sem limite (Meus Chamados, Minhas Tarefas,
// uma instância do hook por coluna/status) e em listas simples com o
// mesmo problema (Minhas Anotações).
//
// Em vez de acumular páginas concatenando o resultado de várias chamadas
// (uma por "carregar mais"), sempre refaz UMA busca só pedindo um `limite`
// maior — bem mais simples de manter consistente depois de um
// criar/editar/mover/excluir no meio da janela já carregada (não tem
// merge/dedup pra acertar), ao custo de rebuscar os itens do começo a cada
// vez. Aceitável pro tamanho de dado deste sistema; se um dia isso pesar,
// dá pra trocar por cursor real sem mudar quem usa o hook.
//
// `buscar(limite)` deve devolver `{ itens, total }` pra aquele `limite`.
// `chave` é o que dispara reset pra janela padrão (ex: termo de busca
// mudou) — mudar só os DADOS (sem trocar `chave`) deve usar `recarregar()`.
export function useListaCarregarMais(buscar, chave, incremento = INCREMENTO_PADRAO) {
  const [itens, setItens] = useState([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erro, setErro] = useState(false)
  const limiteRef = useRef(incremento)
  const buscarRef = useRef(buscar)
  buscarRef.current = buscar

  const carregar = useCallback(async (limite, { silencioso = false, comoMais = false } = {}) => {
    if (!silencioso) (comoMais ? setCarregandoMais : setCarregando)(true)
    try {
      const resposta = await buscarRef.current(limite)
      limiteRef.current = limite
      setItens(resposta.itens)
      setTotal(resposta.total)
      setErro(false)
    } catch {
      // Tradução da mensagem e tratamento de sessão expirada (401) ficam
      // por conta de quem passou `buscar` (cada tela tem seu próprio
      // tratarErroApi/traduzirErroApi via useAuth) — aqui só marca que a
      // última tentativa falhou, pra quem usa o hook decidir o que mostrar.
      setErro(true)
    } finally {
      if (!silencioso) (comoMais ? setCarregandoMais : setCarregando)(false)
    }
  }, [])

  useEffect(() => {
    limiteRef.current = incremento
    carregar(incremento)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  function carregarMais() {
    carregar(limiteRef.current + incremento, { comoMais: true })
  }

  // Rebusca a MESMA janela já carregada, sem acender `carregando` (evita
  // apagar a tela inteira num "Carregando..." só porque um card foi
  // editado/movido/excluído) — quem chama já costuma ter seu próprio
  // feedback visual pontual pra isso (opacidade do card, "Salvando...").
  function recarregar() {
    return carregar(limiteRef.current, { silencioso: true })
  }

  // Igual a `recarregar`, mas COM o "Carregando..." — pro botão "Tentar
  // novamente" depois de um erro, onde mostrar o estado de carregamento é
  // o feedback esperado (não uma recarga silenciosa em segundo plano).
  function tentarNovamente() {
    return carregar(limiteRef.current)
  }

  return {
    itens, total, carregando, carregandoMais, erro,
    temMais: itens.length < total,
    carregarMais, recarregar, tentarNovamente,
    // Escape hatch pra atualização OTIMISTA local (ex: mover um card de
    // coluna arrastando — precisa sumir de uma lista e/ou entrar em outra
    // na hora, sem esperar o round-trip da rede) — mesmo raciocínio já
    // usado antes em MinhasTarefas.jsx, só que agora por coluna. Quem usa
    // continua responsável por reconciliar com o servidor depois (ex:
    // chamando `recarregar()` da(s) coluna(s) afetada(s) ao final).
    definirItensLocal: setItens,
  }
}
