import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { estilos, CORES_STATUS, CORES_APP, CORES_NIVEL, CORES_PRIORIDADE } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { useAvisoSairSemSalvar } from '../hooks/useAvisoSairSemSalvar'
import { formatarData, formatarHora, obterIniciais, tempoDecorrido } from '../utils/formatters'
import { adicionarObservador, atribuirChamado, atualizarNivelChamado, atualizarPrioridadeChamado, atualizarStatusChamado, buscarChamado, buscarColaboradores, buscarComentarios, buscarLogsAuditoria, buscarSolucoesSugeridas, buscarTecnicos, criarComentario, enviarImagem, removerObservador } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { extrairImagemColada } from '../utils/colarImagem'
import { URL_BASE } from '../services/apiClient'
import { LABEL_CATEGORIA } from '../utils/categorias'
import { numeroChamado } from '../utils/numeroChamado'
import { IconChevronDown, IconLightbulb, IconMonitor, IconPaperclip, IconPause, IconPlay, IconRotateCcw } from './icons'
import StatusBadge from './StatusBadge'
import PriorityChip from './PriorityChip'
import AguardandoRespostaBadge from './AguardandoRespostaBadge'
import ResolutionModal from './ResolutionModal'
import ImageLightbox from './ImageLightbox'
import ObservadorSelect from './ObservadorSelect'

// Cluster compacto de "Cc" no cabeçalho: bolhas de iniciais (até 3, com
// "+N" pro resto) que abrem um popover com a lista completa (e o botão de
// remover, só pro técnico) ao clicar. O "+ Adicionar" do técnico
// (ObservadorSelect, inalterado) mora do lado. Componente interno (não
// exportado) só pra manter o header do TicketPanel legível — não precisa
// de arquivo próprio porque não é reaproveitado em nenhum outro lugar.
function ObservadoresCabecalho({ observers, isIT, opcoesParaAdicionar, onAdicionar, onRemover, salvando }) {
  const [mostrarPopover, setMostrarPopover] = useState(false)

  if (observers.length === 0 && !isIT) return null

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
      {observers.length > 0 && (
        <button type="button" onClick={() => setMostrarPopover(v => !v)} title={`${observers.length} em Cc`}
          style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {observers.slice(0, 3).map((o, i) => (
            <div key={o.id} style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${CORES_NIVEL.fgClaro},${CORES_NIVEL.fg})`, border: `2px solid ${CORES_APP.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'Outfit, sans-serif', marginLeft: i === 0 ? 0 : -8 }}>
              {obterIniciais(o.name ?? o.email)}
            </div>
          ))}
          {observers.length > 3 && (
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: CORES_APP.borda, border: `2px solid ${CORES_APP.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: CORES_APP.texto, marginLeft: -8 }}>
              +{observers.length - 3}
            </div>
          )}
        </button>
      )}

      {isIT && (
        <ObservadorSelect opcoes={opcoesParaAdicionar} onAdicionar={onAdicionar} disabled={salvando} />
      )}

      {mostrarPopover && observers.length > 0 && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 8 }} onClick={() => setMostrarPopover(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 9, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: 10, width: 'min(240px, calc(100vw - 48px))', boxSizing: 'border-box', boxShadow: '0 8px 24px rgba(16,35,31,0.18)' }}>
            <div style={{ ...estilos.label, marginBottom: 8 }}>Cc ({observers.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {observers.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: CORES_APP.texto, fontSize: 13 }}>{o.name ?? o.email}</span>
                  {isIT && (
                    <button type="button" onClick={() => onRemover(o.id)} disabled={salvando} title="Remover observador"
                      style={{ background: 'rgba(239,68,68,0.12)', color: CORES_APP.erro, border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 12, lineHeight: 1, cursor: salvando ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Lembra se a sidebar (coluna esquerda) estava expandida ou recolhida da
// ÚLTIMA vez que ESTE chamado específico foi aberto nesta sessão — bônus,
// não obrigatório. Vive FORA do componente de propósito: o TicketPanel
// desmonta toda vez que o painel fecha (App.jsx renderiza
// `{chamadoSelecionado && <TicketPanel />}` sem `key`, e fechar sempre passa
// por `chamadoSelecionado = null` antes de abrir outro chamado), então um
// `useState` comum já reiniciaria sozinho — mas reiniciaria pra TODOS os
// chamados igual, sem lembrar nada de um pro outro. Este Map só existe pra
// guardar essa lembrança quando é o MESMO chamado sendo reaberto; um
// chamado nunca antes aberto nesta sessão nunca tem entrada aqui, então
// sempre nasce expandido — exatamente a regra pedida. Reseta sozinho num
// reload de página (é só memória), o que está OK: a regra explícita é "não
// vazar de um chamado pro outro", não "sobreviver a um F5".
const estadoSidebarPorChamado = new Map()

// Painel de detalhe/atendimento de um chamado. É usado tanto pelo
// colaborador (somente leitura + acompanhamento) quanto pela Área Técnica
// (isIT=true habilita mudança de status e comentários).
//
// Layout em duas colunas (desktop): esquerda tem os FATOS do chamado —
// dados, descrição, print, resolução, ações de status; direita é o FEED de
// conversa (comentários reais + composer). No mobile, as duas "colunas"
// simplesmente empilham em ordem (esquerda inteira, depois direita), sem
// grid — mesma experiência de rolagem única de antes.
//
// Mesmo limite do backend (CriarComentarioDto) — checado aqui também pra
// dar feedback imediato (clique ou paste) em vez de só descobrir no 400
// da API depois de tentar enviar. Não existe um limite real equivalente em
// CreateTicket.jsx/ITAbrirChamado.jsx/ResolutionModal.jsx hoje (o "5" que
// aparece lá é só um limiar de rolagem da lista, não um bloqueio) — este
// limite é novo, introduzido só pra comentário.
const MAXIMO_IMAGENS_COMENTARIO = 5

// Recebe `chamadoInicial` (o que já foi clicado na tela de lista, pra
// aparecer na hora) mas depois mantém seu PRÓPRIO estado `chamado` — toda
// mudança de status/finalização vem da resposta da API, nunca é só
// "imaginada" no front. Comentários são buscados à parte
// (GET /chamados/:id/comentarios), porque a API não os embute na resposta
// do chamado. Quem está autenticado (autor do comentário, técnico
// responsável) é sempre resolvido pelo backend a partir do token — nunca
// enviado daqui.
function TicketPanel({ chamadoInicial, onClose, isIT, onAtualizado }) {
  const { token, usuario, tratarErroApi } = useAuth()
  const [chamado, setChamado] = useState(chamadoInicial)
  const [comentarios, setComentarios] = useState([])
  const [carregandoComentarios, setCarregandoComentarios] = useState(true)
  const [erroComentarios, setErroComentarios] = useState('')
  const [textoComentario, setTextoComentario] = useState('')
  const [comentarioInterno, setComentarioInterno] = useState(false)
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [mostrarModalResolucao, setMostrarModalResolucao] = useState(false)
  // Só usado no bloco "Reabrir" (chamado.resolution existe e ainda não
  // está marcada como conhecida) — decide se o PATCH de reabertura vai
  // junto com marcadaComo:true, ver mudarStatus('parado', extras).
  const [marcarConhecidaAoReabrir, setMarcarConhecidaAoReabrir] = useState(false)
  const [carregandoAcao, setCarregandoAcao] = useState(false)
  const [erroAcao, setErroAcao] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [sugestaoExpandida, setSugestaoExpandida] = useState(null)
  const [mostrarMenuNivel, setMostrarMenuNivel] = useState(false)
  const [salvandoNivel, setSalvandoNivel] = useState(false)
  const [mostrarMenuPrioridade, setMostrarMenuPrioridade] = useState(false)
  const [salvandoPrioridade, setSalvandoPrioridade] = useState(false)
  const [imagemAmpliada, setImagemAmpliada] = useState(null)
  const [arquivosComentario, setArquivosComentario] = useState([])
  const [enviandoImagemComentario, setEnviandoImagemComentario] = useState(false)
  const [colaboradores, setColaboradores] = useState([])
  const [salvandoObservador, setSalvandoObservador] = useState(false)
  const [tecnicos, setTecnicos] = useState([])
  const [salvandoAtribuicao, setSalvandoAtribuicao] = useState(false)
  const [mensagemAtribuicao, setMensagemAtribuicao] = useState('')
  // "Histórico de alterações" — aba somente leitura, só existe pro lado TI
  // (ver isIT mais abaixo). `abaHistorico` decide o que a coluna direita
  // mostra; o colaborador nunca vê o seletor de abas, então pra ele
  // continua sempre 'comentarios', igual era antes desta feature.
  const [abaHistorico, setAbaHistorico] = useState('comentarios')
  const [logs, setLogs] = useState([])
  const [carregandoLogs, setCarregandoLogs] = useState(true)
  const [erroLogs, setErroLogs] = useState('')

  // Comentário digitado (ou imagem anexada) e ainda não enviado — avisa
  // antes de fechar a aba/recarregar, mesmo o modal continuando aberto por
  // cima de outra tela (ver useAvisoSairSemSalvar).
  useAvisoSairSemSalvar(Boolean(textoComentario.trim() || arquivosComentario.length > 0))
  // Sempre nasce expandida (regra 1/3), exceto se ESTE MESMO chamado já
  // tinha sido aberto (e recolhido) antes nesta sessão (regra 4, bônus) —
  // ver comentário em `estadoSidebarPorChamado` acima.
  const [sidebarExpandida, setSidebarExpandida] = useState(() => estadoSidebarPorChamado.get(chamadoInicial.id) ?? true)
  const fileRefComentario = useRef(null)
  const cabecalhoRef = useRef(null)
  const [alturaCabecalho, setAlturaCabecalho] = useState(0)
  const largura = useWindowWidth()
  const mobile = largura < 768

  // Mede a altura real do cabeçalho (varia: badges quebram linha em telas
  // estreitas, "Cc" aparece/some) pra calcular quanto sobra de altura pra
  // coluna direita — ver maxHeight dela mais abaixo. ResizeObserver em vez
  // de depender de `largura` porque o conteúdo do cabeçalho pode mudar de
  // altura por outros motivos (ex: título de duas linhas) sem a largura da
  // janela mudar.
  useEffect(() => {
    if (!cabecalhoRef.current) return
    const observer = new ResizeObserver(([entry]) => setAlturaCabecalho(entry.contentRect.height))
    observer.observe(cabecalhoRef.current)
    return () => observer.disconnect()
  }, [])

  // "Histórico de comentários" (feed de conversa, coluna direita) mostra só
  // comentários de verdade — o log de reclassificação de nível
  // (tipo NIVEL_AJUSTADO) vai pra um histórico compacto separado, na coluna
  // esquerda (ver mais abaixo). Colaborador nunca recebe esses registros do
  // backend de qualquer forma (são sempre `interno: true`), então
  // `historicoNivel` já vem naturalmente vazio pro lado colaborador.
  const comentariosReais = comentarios.filter(c => !c.isLevelChange)
  const historicoNivel = comentarios.filter(c => c.isLevelChange)

  async function buscarComentariosDoChamado() {
    setCarregandoComentarios(true)
    setErroComentarios('')
    try {
      setComentarios(await buscarComentarios(token, chamado.id))
    } catch (e) {
      if (!tratarErroApi(e)) setErroComentarios(traduzirErroApi(e))
    } finally {
      setCarregandoComentarios(false)
    }
  }

  useEffect(() => {
    buscarComentariosDoChamado()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamado.id])

  async function buscarLogsDoChamado() {
    setCarregandoLogs(true)
    setErroLogs('')
    try {
      setLogs(await buscarLogsAuditoria(token, chamado.id))
    } catch (e) {
      if (!tratarErroApi(e)) setErroLogs(traduzirErroApi(e))
    } finally {
      setCarregandoLogs(false)
    }
  }

  // Só busca pro lado TI (rota é @Roles(TECNICO) no backend — colaborador
  // receberia 403). Mesmo padrão de "busca uma vez, quando o chamado muda"
  // do histórico de comentários acima, independente de qual aba está
  // aberta no momento — evita um segundo carregamento visível ao trocar de
  // aba pela primeira vez.
  useEffect(() => {
    if (!isIT) return
    buscarLogsDoChamado()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamado.id, isIT])

  // Sugestões de chamados parecidos: só faz sentido pro técnico, e só
  // enquanto o chamado ainda está em aberto (uma vez finalizado, a seção
  // "Como foi resolvido" já cumpre esse papel). Falha silenciosamente —
  // isso é um bônus discreto, não algo que deve travar o painel se der erro.
  useEffect(() => {
    if (!isIT || chamado.status === 'finalizado') {
      setSugestoes([])
      return
    }
    let cancelado = false
    buscarSolucoesSugeridas(token, chamado.id)
      .then(resultado => { if (!cancelado) setSugestoes(resultado) })
      .catch(() => { if (!cancelado) setSugestoes([]) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamado.id, chamado.status, isIT])

  // Lista de colaboradores pra montar as opções do "+ Adicionar" de
  // observador ("Cc") — só o técnico precisa disso. Busca uma vez só
  // (não depende do chamado), a lista de colaboradores da empresa não
  // muda com o painel aberto.
  useEffect(() => {
    if (!isIT) return
    let cancelado = false
    buscarColaboradores(token)
      .then(resultado => { if (!cancelado) setColaboradores(resultado.itens) })
      .catch(() => { if (!cancelado) setColaboradores([]) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIT])

  // Lista de técnicos pra montar as opções do dropdown "Atribuído a" — só o
  // técnico precisa disso, mesmo padrão de `colaboradores` acima (busca uma
  // vez só, a lista de técnicos não muda com o painel aberto).
  useEffect(() => {
    if (!isIT) return
    let cancelado = false
    buscarTecnicos(token)
      .then(resultado => { if (!cancelado) setTecnicos(resultado) })
      .catch(() => { if (!cancelado) setTecnicos([]) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIT])

  // Minimizar/expandir é sempre uma ação manual (clique aqui) — nunca
  // acontece sozinho por tempo ou rolagem. Guarda a escolha no Map de
  // sessão pra, se ESTE chamado for reaberto depois, lembrar o que o
  // técnico deixou (regra 4, bônus).
  function alternarSidebar() {
    setSidebarExpandida(v => {
      const novoValor = !v
      estadoSidebarPorChamado.set(chamado.id, novoValor)
      return novoValor
    })
  }

  async function adicionarObservadorAoChamado(usuarioId) {
    setErroAcao('')
    setSalvandoObservador(true)
    try {
      const atualizado = await adicionarObservador(token, chamado.id, usuarioId)
      setChamado(atualizado)
      onAtualizado()
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      setSalvandoObservador(false)
    }
  }

  async function removerObservadorDoChamado(usuarioId) {
    setErroAcao('')
    setSalvandoObservador(true)
    try {
      const atualizado = await removerObservador(token, chamado.id, usuarioId)
      setChamado(atualizado)
      onAtualizado()
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      setSalvandoObservador(false)
    }
  }

  // Define/troca/remove o técnico responsável — `novoTecnicoId` vazio
  // ('') do <select> vira null (desatribuir). Mensagem de sucesso some
  // sozinha depois de um tempo, mesmo padrão "feedback discreto" já usado
  // no resto do painel (sem toast/lib nova pra isso).
  async function atribuirTecnicoAoChamado(novoTecnicoId) {
    setErroAcao('')
    setMensagemAtribuicao('')
    setSalvandoAtribuicao(true)
    try {
      const atualizado = await atribuirChamado(token, chamado.id, novoTecnicoId || null)
      setChamado(atualizado)
      onAtualizado()
      setMensagemAtribuicao(atualizado.assignedTo ? `Atribuído a ${atualizado.assignedTo}` : 'Chamado desatribuído')
      setTimeout(() => setMensagemAtribuicao(''), 3000)
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      setSalvandoAtribuicao(false)
    }
  }

  // Reclassificação manual de nível — a regra automática (categoria +
  // palavra-chave) é só um ponto de partida; o técnico pode corrigir aqui
  // quando ela erra. O ajuste vira um comentário automático no backend (ver
  // ChamadosService.reclassificarNivel), então recarregamos os comentários
  // pra esse registro aparecer na hora, sem precisar reabrir o painel.
  async function reclassificarNivel(novoNivel) {
    setMostrarMenuNivel(false)
    if (novoNivel === chamado.level) return
    setErroAcao('')
    setSalvandoNivel(true)
    try {
      const atualizado = await atualizarNivelChamado(token, chamado.id, novoNivel)
      setChamado(atualizado)
      onAtualizado()
      await buscarComentariosDoChamado()
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      setSalvandoNivel(false)
    }
  }

  // Mesmo raciocínio de reclassificarNivel logo acima — idempotente (não
  // chama a API se a prioridade escolhida já é a atual) e recarrega
  // onAtualizado() pra refletir em qualquer lista aberta por trás
  // (Central de Chamados, Meus Chamados etc.).
  async function alterarPrioridade(novaPrioridade) {
    setMostrarMenuPrioridade(false)
    if (novaPrioridade === chamado.priority) return
    setErroAcao('')
    setSalvandoPrioridade(true)
    try {
      const atualizado = await atualizarPrioridadeChamado(token, chamado.id, novaPrioridade)
      setChamado(atualizado)
      onAtualizado()
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      setSalvandoPrioridade(false)
    }
  }

  async function mudarStatus(novoStatus, extras = {}) {
    setErroAcao('')
    setCarregandoAcao(true)
    try {
      const atualizado = await atualizarStatusChamado(token, chamado.id, { status: novoStatus, ...extras })
      setChamado(atualizado)
      onAtualizado()
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
    } finally {
      setCarregandoAcao(false)
    }
  }

  async function finalizar({ texto, solucaoConhecida, imagensUrlsSolucao }) {
    setErroAcao('')
    setCarregandoAcao(true)
    try {
      const atualizado = await atualizarStatusChamado(token, chamado.id, {
        status: 'finalizado',
        comoFoiResolvido: texto,
        marcadaComo: solucaoConhecida,
        imagensUrlsSolucao,
      })
      setChamado(atualizado)
      onAtualizado()
      setMostrarModalResolucao(false)
    } catch (e) {
      if (!tratarErroApi(e)) setErroAcao(traduzirErroApi(e))
      // Relança pro ResolutionModal (que agora aguarda essa chamada) saber
      // que falhou e mostrar o erro NELE MESMO — o modal fica por cima do
      // painel, então um erro exibido só aqui embaixo ficaria escondido
      // atrás dele, invisível pro técnico (era exatamente isso que fazia o
      // "finalizar de novo" parecer travado sem explicação nenhuma).
      throw e
    } finally {
      setCarregandoAcao(false)
    }
  }

  // Compartilhado pelo <input type="file"> (clique) e pelo paste — evita
  // duplicar a checagem de limite nos dois lugares. Corta no limite em vez
  // de recusar tudo (ex: já tem 4, cola/seleciona 3: entram só 1, com
  // mensagem clara em vez de um bloqueio silencioso ou tudo-ou-nada).
  function adicionarArquivosComentario(novos) {
    if (novos.length === 0) return
    setArquivosComentario(prev => {
      const espacoDisponivel = MAXIMO_IMAGENS_COMENTARIO - prev.length
      if (espacoDisponivel <= 0) {
        setErroComentarios(`Máximo de ${MAXIMO_IMAGENS_COMENTARIO} imagens por comentário`)
        return prev
      }
      if (novos.length > espacoDisponivel) {
        setErroComentarios(`Máximo de ${MAXIMO_IMAGENS_COMENTARIO} imagens por comentário — só ${espacoDisponivel} foram adicionadas`)
      }
      return [...prev, ...novos.slice(0, espacoDisponivel)]
    })
  }

  // Ctrl+V na textarea do comentário — diferente dos formulários de abrir
  // chamado/finalizar (onPaste no card inteiro), aqui é só a textarea
  // mesmo: o resto do painel (tabs, seletor de nível etc.) não tem nenhum
  // campo de texto que faça sentido interceptar paste.
  function aoColarNoComentario(e) {
    const arquivo = extrairImagemColada(e)
    if (arquivo) adicionarArquivosComentario([arquivo])
  }

  async function adicionarComentarioNoChamado() {
    if (!textoComentario.trim() && arquivosComentario.length === 0) return
    setEnviandoComentario(true)
    setErroComentarios('')
    try {
      const imagensUrls = []
      if (arquivosComentario.length > 0) {
        setEnviandoImagemComentario(true)
        // Sequencial (não Promise.all) — mesmo motivo de CreateTicket.jsx/
        // ResolutionModal.jsx: evita disparar todos os uploads de uma vez
        // pro mesmo endpoint.
        for (const arquivo of arquivosComentario) {
          imagensUrls.push(await enviarImagem(token, arquivo))
        }
        setEnviandoImagemComentario(false)
      }
      const novo = await criarComentario(token, chamado.id, { texto: textoComentario, interno: comentarioInterno, imagensUrls })
      setComentarios(prev => [...prev, novo])
      setTextoComentario('')
      setComentarioInterno(false)
      setArquivosComentario([])
      // Comentar (quando não-interno, com o chamado em andamento) muda
      // `aguardandoRespostaDe` no backend — busca o chamado de novo pra
      // esse indicativo virar na hora aqui no cabeçalho, sem esperar uma
      // ação de status pra "sem querer" atualizar ele. onAtualizado() avisa
      // as listas (Central de Chamados, Meus Chamados, Acompanhando) pra
      // também refletirem isso da próxima vez que buscarem.
      const atualizado = await buscarChamado(token, chamado.id)
      setChamado(atualizado)
      onAtualizado()
    } catch (e) {
      if (!tratarErroApi(e)) setErroComentarios(traduzirErroApi(e))
    } finally {
      setEnviandoComentario(false)
      setEnviandoImagemComentario(false)
    }
  }

  const chamadoFinalizado = chamado.status === 'finalizado'
  // Dono do chamado OU qualquer técnico — mesma regra validada no backend
  // (ChamadosService.atualizarPrioridade), checada aqui só pra decidir a
  // aparência (badge clicável ou não). `usuario.id`/`chamado.userId` são
  // string os dois (ver mapearUsuario/mapearChamado).
  const podeEditarPrioridade = !chamadoFinalizado && (isIT || chamado.userId === usuario.id)

  return (
    <>
      {/* Mesmo piloto de ResolutionModal.jsx (ver comentário lá) — fade no
          overlay, fade+leve escala no painel, mesma duração rápida
          (0.15-0.18s). AnimatePresence precisa envolver o PONTO DE
          MONTAGEM condicional deste componente (em App.jsx, onde
          `chamadoSelecionado && <TicketPanel .../>` decide se ele existe),
          não algo aqui dentro — é lá que a saída precisa ser animada. */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: mobile ? 'stretch' : 'center', justifyContent: 'center', padding: mobile ? 0 : 28 }} onClick={onClose}>
        <div style={{ position: 'absolute', inset: 0, background: CORES_APP.overlay, backdropFilter: 'blur(4px)' }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.18, ease: 'easeOut' }}
          // `height` fixo em 88vh (não mais usado no desktop) fazia o modal
          // sempre ocupar quase a tela inteira, mesmo com pouco conteúdo
          // (ex: chamado sem comentário nenhum) — sobrava um vazio enorme
          // embaixo. `maxHeight` resolve isso: o modal cresce com o
          // conteúdo real e só é limitado (com scroll interno, já existente
          // via overflowY) quando o conteúdo é MAIOR que 88vh. No mobile
          // continua `height:100%` de propósito — ali é uma tela cheia tipo
          // página, não um modal que deve encolher pro conteúdo.
          style={{ position: 'relative', width: mobile ? '100%' : '78%', maxWidth: 1080, height: mobile ? '100%' : undefined, maxHeight: mobile ? undefined : '88vh', background: CORES_APP.card, border: mobile ? 'none' : `1px solid ${CORES_APP.borda}`, borderRadius: mobile ? 0 : 18, overflowY: 'auto', padding: mobile ? 20 : 36, display: 'flex', flexDirection: 'column', gap: 22, boxShadow: mobile ? 'none' : '0 24px 70px rgba(16,35,31,0.22)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Cabeçalho — fora das duas colunas, contexto compartilhado por
              ambas: badges, título, "Cc" compacto, fechar. Não é sticky nem
              fixo de propósito — ele rola junto com a coluna esquerda, que
              é quem manda na altura agora (ver comentário no grid abaixo).
              O ref é só pra medir a altura dele e calcular quanto sobra pra
              coluna direita (maxHeight dela, mais abaixo). */}
          <div ref={cabecalhoRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                <StatusBadge status={chamado.status} />
                {podeEditarPrioridade ? (
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setMostrarMenuPrioridade(v => !v)} disabled={salvandoPrioridade}
                      title="Alterar prioridade"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', padding: 0, cursor: salvandoPrioridade ? 'default' : 'pointer' }}>
                      <PriorityChip priority={chamado.priority} />
                      <IconChevronDown width={11} height={11} style={{ color: CORES_APP.textoSuave, transform: mostrarMenuPrioridade ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {mostrarMenuPrioridade && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 6 }} onClick={() => setMostrarMenuPrioridade(false)} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 7, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, padding: 4, boxShadow: '0 8px 24px rgba(16,35,31,0.18)', minWidth: 90 }}>
                          {['baixa', 'media', 'alta'].map(p => (
                            <button key={p} type="button" onClick={() => alterarPrioridade(p)}
                              style={{ display: 'block', width: '100%', textAlign: 'left', background: p === chamado.priority ? CORES_APP.fundoCampo : 'transparent', color: p === chamado.priority ? CORES_PRIORIDADE[p].fg ?? CORES_PRIORIDADE[p].dot : CORES_APP.texto, border: 'none', borderRadius: 6, padding: '6px 9px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: p === chamado.priority ? 600 : 400, cursor: 'pointer' }}>
                              {CORES_PRIORIDADE[p].label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <PriorityChip priority={chamado.priority} />
                )}
                <AguardandoRespostaBadge status={chamado.status} aguardandoRespostaDe={chamado.aguardandoRespostaDe} isIT={isIT} />
                {isIT ? (
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setMostrarMenuNivel(v => !v)} disabled={salvandoNivel}
                      title="Reclassificar nível"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: CORES_NIVEL.bg, color: CORES_NIVEL.fgClaro, border: 'none', borderRadius: 99, padding: '3px 7px 3px 10px', fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif', cursor: salvandoNivel ? 'default' : 'pointer' }}>
                      {chamado.level}
                      <IconChevronDown width={11} height={11} style={{ transform: mostrarMenuNivel ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {mostrarMenuNivel && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 6 }} onClick={() => setMostrarMenuNivel(false)} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 7, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 8, padding: 4, boxShadow: '0 8px 24px rgba(16,35,31,0.18)', minWidth: 64 }}>
                          {['N1', 'N2', 'N3'].map(n => (
                            <button key={n} type="button" onClick={() => reclassificarNivel(n)}
                              style={{ display: 'block', width: '100%', textAlign: 'left', background: n === chamado.level ? CORES_NIVEL.bg : 'transparent', color: n === chamado.level ? CORES_NIVEL.fgClaro : CORES_APP.texto, border: 'none', borderRadius: 6, padding: '6px 9px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: n === chamado.level ? 600 : 400, cursor: 'pointer' }}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <span style={{ background: CORES_NIVEL.bg, color: CORES_NIVEL.fgClaro, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{chamado.level}</span>
                )}
                <span style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>{LABEL_CATEGORIA[chamado.category] ?? chamado.category}</span>
                <ObservadoresCabecalho
                  observers={chamado.observers}
                  isIT={isIT}
                  opcoesParaAdicionar={colaboradores.filter(u => u.id !== chamado.userId && !chamado.observers.some(o => o.id === u.id))}
                  onAdicionar={adicionarObservadorAoChamado}
                  onRemover={removerObservadorDoChamado}
                  salvando={salvandoObservador}
                />
              </div>
              {/* overflowWrap: um título/descrição sem espaço nenhum (ex:
                  colado de um sistema, ou uma URL) não tem onde quebrar
                  linha por padrão — o texto estoura a largura do container
                  em vez de virar linha. Aplicado aqui e na Descrição
                  (abaixo) pelo mesmo motivo; título curto normal (o caso
                  comum) não muda em nada. */}
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 19, color: CORES_APP.tinta, margin: 0, lineHeight: 1.4, overflowWrap: 'break-word' }}>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, fontSize: 14, color: CORES_APP.textoSuave, marginRight: 8 }}>{numeroChamado(chamado.id)}</span>
                {chamado.summary}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Único botão de ver/ocultar os detalhes do chamado, pros
                  dois formatos — mora no cabeçalho (sempre visível,
                  independente do estado) em vez de dentro da própria
                  coluna esquerda: no desktop recolhido a coluna nem vira
                  mais um item do grid (ver comentário no grid abaixo, isso
                  é o que deixa a conversa centralizar de verdade no painel
                  inteiro, sem reservar espaço de rail); no mobile, quando
                  recolhida, o overlay nem está no DOM — não teria onde um
                  botão "de dentro" morar nos dois casos. */}
              <button type="button" onClick={alternarSidebar}
                title={sidebarExpandida ? 'Recolher detalhes do chamado' : 'Expandir detalhes do chamado'}
                style={{ background: sidebarExpandida ? 'rgba(0,179,81,0.12)' : CORES_APP.fundoCampo, border: 'none', cursor: 'pointer', color: sidebarExpandida ? CORES_APP.verde : CORES_APP.textoFraco, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconChevronDown width={15} height={15} style={{ transform: sidebarExpandida ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }} />
              </button>
              <button onClick={onClose} style={{ background: CORES_APP.fundoCampo, border: 'none', cursor: 'pointer', color: CORES_APP.textoFraco, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>
          </div>

          {/* Duas colunas no desktop (fatos à esquerda, conversa à
              direita) SÓ quando expandida — recolhida, a coluna esquerda
              simplesmente não existe mais como item do grid (o botão de
              reabrir mora no cabeçalho, não aqui), o grid vira uma única
              coluna e a conversa centraliza de verdade no painel inteiro
              (ver maxWidth/margin dela mais abaixo) — se ainda houvesse uma
              "rail" reservando espaço fixo pro botão, a conversa nunca
              ficaria genuinamente centralizada, só centralizada dentro do
              espaço que sobrasse ao lado da rail. No mobile, quando
              expandida, a esquerda vira um overlay (position:absolute,
              cobre só a área abaixo do cabeçalho, que continua fora/acima
              dela) — nunca empilha nem empurra a conversa por baixo.
              `position:relative` aqui é o que ancora esse overlay. No
              desktop expandido, IMPORTANTE: a coluna esquerda NUNCA pode
              ficar escondida — ela é quem manda na altura da linha do grid
              (sem gridTemplateRows forçado, sem flex/minHeight travando a
              linha), e o painel inteiro (acima) tem overflow-y:auto pra
              rolar e revelar ela por completo quando o conteúdo for mais
              alto que a viewport. A coluna direita continua rolando por
              dentro (não precisa do painel rolar pra ver mais comentário):
              é sticky (gruda no topo do painel conforme ele rola) com
              maxHeight calculado a partir da altura medida do cabeçalho,
              então ela nunca fica mais alta do que o espaço realmente
              visível — ver alturaCabecalho acima. */}
          <div style={{ position: 'relative', display: 'flex' }}>

            {/* ── Coluna esquerda: fatos do chamado e ações — só renderiza
                quando expandida (desktop: item normal do grid; mobile:
                overlay absoluto sobre a conversa). Nasce expandida sempre
                que é a primeira vez que ESTE chamado é aberto na sessão
                (ver `sidebarExpandida` acima), nunca detona sozinha por
                tempo ou scroll, só pelo clique no botão do cabeçalho.
                AnimatePresence com initial={false}: sem isso, ela também
                tocaria a animação de entrada no primeiro render do painel
                inteiro (que já tem sua própria animação, via motion.div
                lá em cima) — aqui só deve animar quando o TOGGLE muda o
                estado depois de montado, não a montagem inicial.

                Desktop anima `width`/`marginRight` (0↔380/0↔28) no MESMO
                motion.div que também controla a opacidade — de propósito,
                depois de um bug real encontrado em teste: a primeira
                versão usava uma transição CSS separada em
                `grid-template-columns` pra animar a largura da coluna,
                paralela à animação do framer-motion no conteúdo. Duas
                animações de motores diferentes (CSS transition vs.
                framer-motion), mesmo com a mesma duração declarada, não
                terminam garantidamente no mesmo frame — no instante em
                que o AnimatePresence desmontava o conteúdo, se o grid
                ainda não tivesse chegado a 0px de verdade, sobrava um
                micro-reajuste visível bem no final. Com UMA animação só
                controlando width+marginRight+opacity juntos, e a coluna
                da conversa em `flex:1` (recalculada pelo navegador a cada
                frame, sem transição própria, só reagindo ao tamanho atual
                do irmão), não existem dois sistemas pra sincronizar.

                Mobile continua com o slide simples (x + fade) de antes —
                lá a sidebar é `position:absolute`, não disputa espaço com
                a conversa, então nunca teve esse problema. */}
            <AnimatePresence initial={false}>
              {sidebarExpandida && (
                <motion.div
                  key="sidebar-coluna"
                  initial={mobile ? { opacity: 0, x: -20 } : { opacity: 0, width: 0, marginRight: 0 }}
                  animate={mobile ? { opacity: 1, x: 0 } : { opacity: 1, width: 380, marginRight: 28 }}
                  exit={mobile ? { opacity: 0, x: -20 } : { opacity: 0, width: 0, marginRight: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={mobile ? {
                    position: 'absolute', inset: 0, zIndex: 20, background: CORES_APP.card,
                    padding: 20, boxSizing: 'border-box', overflowY: 'auto',
                    boxShadow: '0 12px 40px rgba(16,35,31,0.2)',
                    display: 'flex', flexDirection: 'column', gap: 20,
                  } : {
                    overflow: 'hidden', flexShrink: 0, alignSelf: 'start',
                  }}>
                <div style={mobile ? undefined : { display: 'flex', flexDirection: 'column', gap: 20, width: 380 }}>
              {isIT && sugestoes.length > 0 && (
                <div style={{ background: CORES_NIVEL.bgCaixaSugestao, border: `1px solid ${CORES_NIVEL.bordaCaixaSugestao}`, borderRadius: 12, padding: '14px 15px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: CORES_NIVEL.fg, display: 'flex' }}><IconLightbulb width={14} height={14} /></span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: CORES_NIVEL.fg }}>Chamados parecidos já foram resolvidos</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sugestoes.map(s => {
                      const aberta = sugestaoExpandida === s.chamadoId
                      return (
                        <div key={s.chamadoId} style={{ background: CORES_APP.fundoCampo, border: `1px solid ${CORES_NIVEL.bordaItemSugestao}`, borderRadius: 8, overflow: 'hidden' }}>
                          <button onClick={() => setSugestaoExpandida(aberta ? null : s.chamadoId)}
                            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ color: CORES_APP.texto, fontSize: 13 }}>{s.summary}</span>
                            <span style={{ color: CORES_NIVEL.fgClaro, fontSize: 12, fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>{aberta ? 'Ocultar ▲' : 'Como foi resolvido ▾'}</span>
                          </button>
                          {aberta && (
                            <div style={{ padding: '0 12px 12px' }}>
                              <p style={{ color: CORES_NIVEL.fg, fontSize: 13, margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{s.resolutionText}</p>
                              <p style={{ color: CORES_APP.textoSuave, fontSize: 11, margin: '6px 0 0' }}>Categoria já apareceu {s.ocorrenciasCategoria}x</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: CORES_APP.fundoCampo, borderRadius: 10, padding: '11px 13px' }}>
                  <div style={estilos.label}>Solicitante</div>
                  <div style={{ color: CORES_APP.tinta, fontWeight: 500, fontSize: 14 }}>{chamado.solicitanteNome ?? '(conta resetada)'}</div>
                  {chamado.solicitanteDept && <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginTop: 1 }}>{chamado.solicitanteDept}</div>}
                  {/* Auditoria de quem abriu em nome do solicitante — só
                      pro lado TI. O colaborador só precisa saber que o
                      chamado é dele; quem criou o registro não muda isso. */}
                  {isIT && chamado.abertoPorTecnicoNome && (
                    <div style={{ color: CORES_NIVEL.fg, fontSize: 11, marginTop: 4 }}>Aberto por {chamado.abertoPorTecnicoNome} em nome do solicitante</div>
                  )}
                </div>
                <div style={{ background: CORES_APP.fundoCampo, borderRadius: 10, padding: '11px 13px' }}>
                  <div style={estilos.label}>Aberto em</div>
                  <div style={{ color: CORES_APP.tinta, fontWeight: 500, fontSize: 14 }}>{formatarData(chamado.created)}</div>
                  <div style={{ color: CORES_APP.textoFraco, fontSize: 12, marginTop: 1 }}>{formatarHora(chamado.created)}</div>
                </div>
                {/* Lado TI: dropdown editável, sempre visível (mesmo sem
                    responsável ainda) pra permitir atribuir. Lado
                    colaborador: continua exatamente como antes — texto
                    somente-leitura, só aparece quando já tem responsável. */}
                {isIT ? (
                  <div style={{ background: CORES_APP.fundoCampo, borderRadius: 10, padding: '11px 13px' }}>
                    <div style={estilos.label}>Atribuído a</div>
                    <select value={chamado.assignedToId ?? ''} disabled={salvandoAtribuicao || tecnicos.length === 0}
                      onChange={e => atribuirTecnicoAoChamado(e.target.value)}
                      style={{ width: '100%', background: 'transparent', color: chamado.assignedTo ? CORES_APP.verde : CORES_APP.textoFraco, fontWeight: 500, fontSize: 14, fontFamily: 'Inter, sans-serif', border: 'none', outline: 'none', padding: 0, cursor: salvandoAtribuicao ? 'default' : 'pointer' }}>
                      <option value="">Não atribuído</option>
                      {tecnicos.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {mensagemAtribuicao && <div style={{ color: CORES_APP.verde, fontSize: 11, marginTop: 4 }}>{mensagemAtribuicao}</div>}
                  </div>
                ) : chamado.assignedTo && (
                  <div style={{ background: CORES_APP.fundoCampo, borderRadius: 10, padding: '11px 13px' }}>
                    <div style={estilos.label}>Responsável TI</div>
                    <div style={{ color: CORES_APP.verde, fontWeight: 500, fontSize: 14 }}>{chamado.assignedTo}</div>
                  </div>
                )}
                <div style={{ background: CORES_APP.fundoCampo, borderRadius: 10, padding: '11px 13px' }}>
                  <div style={estilos.label}>Última atualização</div>
                  <div style={{ color: CORES_APP.tinta, fontWeight: 500, fontSize: 14 }}>{tempoDecorrido(chamado.updated)}</div>
                </div>
                {chamado.anydeskId && (
                  <div style={{ background: CORES_APP.fundoCampo, borderRadius: 10, padding: '11px 13px' }}>
                    <div style={estilos.label}>ID do AnyDesk</div>
                    <div style={{ color: CORES_APP.tinta, fontWeight: 500, fontSize: 14 }}>{chamado.anydeskId}</div>
                  </div>
                )}
              </div>

              {/* Botão de conectar é exclusivo do técnico — o DADO
                  (anydeskId) já é visível pros dois lados no grid acima
                  (sempre exibido do jeito que o colaborador digitou, pra
                  ele conferir que digitou certo), mas só a Área Técnica tem
                  motivo pra realmente abrir uma conexão remota. O campo
                  aceita qualquer formato colado (espaços, traços...), mas o
                  link "anydesk:" só entende dígitos — por isso o href limpa
                  tudo que não for número antes de montar a URL, sem alterar
                  o que aparece escrito acima. */}
              {isIT && chamado.anydeskId && (
                <a href={`anydesk:${chamado.anydeskId.replace(/\D/g, '')}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(0,179,81,0.12)', color: CORES_APP.verde, border: '1px solid rgba(0,120,81,0.3)', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
                  <IconMonitor width={15} height={15} /> Conectar via AnyDesk
                </a>
              )}

              <div>
                <div style={estilos.label}>Descrição</div>
                {/* maxHeight + overflowY própria (não a do modal inteiro) —
                    uma descrição muito longa (texto colado de outro lugar,
                    por exemplo) antes fazia o modal INTEIRO crescer pra
                    acomodar, empurrando a conversa/comentários pra muito
                    longe. Com isso, só este bloco rola por dentro; o resto
                    do painel mantém uma altura previsível. Mesmo padrão já
                    usado no histórico de comentários (coluna direita) e na
                    lista de anexos com 5+ imagens. */}
                <p style={{ color: CORES_APP.texto, fontSize: 14, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>{chamado.description}</p>
              </div>

              {chamado.errorMsg && (
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ ...estilos.label, color: CORES_APP.erro, marginBottom: 6 }}>Mensagem de erro</div>
                  <code style={{ color: CORES_PRIORIDADE.alta.fg, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word', display: 'block', maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>{chamado.errorMsg}</code>
                </div>
              )}

              {chamado.imagens.length > 0 && (
                <div style={{ background: CORES_APP.fundoCampo, border: '1px solid rgba(0,120,81,0.14)', borderRadius: 10, padding: 14 }}>
                  <div style={estilos.label}>{chamado.imagens.length > 1 ? `Prints anexados (${chamado.imagens.length})` : 'Print anexado'}</div>
                  {/* Uma imagem só: preview grande, mesmo tamanho de antes.
                      Mais de uma: grade de miniaturas — cada uma abre no
                      lightbox igual, só muda o tamanho de exibição aqui. */}
                  {chamado.imagens.length === 1 ? (
                    <img src={`${URL_BASE}${chamado.imagens[0]}`} alt="Print do erro" onClick={() => setImagemAmpliada(`${URL_BASE}${chamado.imagens[0]}`)}
                      style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8, display: 'block', cursor: 'zoom-in' }} />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {chamado.imagens.map((url, indice) => (
                        <img key={url} src={`${URL_BASE}${url}`} alt={`Print do erro ${indice + 1}`} onClick={() => setImagemAmpliada(`${URL_BASE}${url}`)}
                          style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in' }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {chamado.resolution && (
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 12, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✓</div>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: CORES_STATUS.finalizado.fg }}>Como foi resolvido</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {chamado.resolution.isKnownSolution && (
                        <span style={{ background: 'rgba(0,179,81,0.12)', color: CORES_APP.verde, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Solução conhecida</span>
                      )}
                      <span style={{ color: CORES_APP.textoSuave, fontSize: 11 }}>por {chamado.resolution.resolvedBy}</span>
                    </div>
                  </div>
                  <p style={{ color: CORES_APP.texto, fontSize: 14, margin: 0, lineHeight: 1.75, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{chamado.resolution.text}</p>
                  {/* Chamado reaberto depois de já ter sido finalizado uma
                      vez: a solução original fica visível e intacta (regra
                      de negócio combinada — reabrir e finalizar de novo não
                      pede nem grava uma solução nova), então avisamos aqui
                      pra não parecer que o botão "Finalizar" foi ignorado
                      quando o técnico usar de novo. */}
                  {isIT && chamado.status !== 'finalizado' && (
                    <p style={{ color: CORES_APP.textoSuave, fontSize: 12, margin: 0 }}>
                      Chamado reaberto. Esta solução já registrada fica mantida. Finalizar de novo não vai pedir uma nova.
                    </p>
                  )}
                </div>
              )}

              {/* Histórico de nível: separado da conversa de propósito (ver
                  comentário em `historicoNivel` acima) — um log compacto,
                  sem a moldura de balão de comentário. Só existe pro
                  técnico na prática, porque cada entrada nasce como
                  comentário interno, que o backend já nem envia pro
                  colaborador. */}
              {historicoNivel.length > 0 && (
                <div>
                  <div style={estilos.label}>Histórico de nível</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {historicoNivel.map(h => (
                      <div key={h.id} style={{ fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ color: CORES_NIVEL.fg }}>{h.text}</span>
                        <span style={{ color: CORES_APP.textoSuave }}> · {h.author} · {formatarData(h.date)} {formatarHora(h.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {erroAcao && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroAcao}</p>}

              {isIT && (
                <div>
                  <div style={estilos.label}>Alterar status</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {chamado.status === 'parado' && (
                      <button onClick={() => mudarStatus('andamento')} disabled={carregandoAcao}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: CORES_STATUS.finalizado.fg, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: carregandoAcao ? 'default' : 'pointer', letterSpacing: '0.04em', opacity: carregandoAcao ? 0.6 : 1 }}>
                        <IconPlay width={13} height={13} /> Iniciar Atendimento
                      </button>
                    )}
                    {chamado.status === 'andamento' && (
                      <>
                        <button onClick={() => chamado.resolution ? mudarStatus('finalizado') : setMostrarModalResolucao(true)} disabled={carregandoAcao}
                          title={chamado.resolution ? 'Chamado já tem uma solução registrada, finaliza sem pedir uma nova' : undefined}
                          style={{ background: CORES_STATUS.finalizado.bg, color: CORES_STATUS.finalizado.fg, border: `1px solid rgba(0,120,81,0.28)`, borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: carregandoAcao ? 'default' : 'pointer', opacity: carregandoAcao ? 0.6 : 1 }}>
                          ✓ Finalizar
                        </button>
                        <button onClick={() => mudarStatus('parado')} disabled={carregandoAcao}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: CORES_STATUS.parado.bg, color: CORES_STATUS.parado.fg, border: '1px solid rgba(138,150,163,0.35)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: carregandoAcao ? 'default' : 'pointer', opacity: carregandoAcao ? 0.6 : 1 }}>
                          <IconPause width={13} height={13} /> Pausar
                        </button>
                      </>
                    )}
                    {chamado.status === 'finalizado' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <button onClick={() => mudarStatus('parado', marcarConhecidaAoReabrir ? { marcadaComo: true } : {})} disabled={carregandoAcao}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: CORES_STATUS.parado.bg, color: CORES_STATUS.parado.fg, border: '1px solid rgba(138,150,163,0.35)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: carregandoAcao ? 'default' : 'pointer', opacity: carregandoAcao ? 0.6 : 1 }}>
                          <IconRotateCcw width={13} height={13} /> Reabrir
                        </button>
                        {/* Só oferece a opção quando ainda NÃO está marcada
                            — se já é solução conhecida, não tem o que
                            marcar de novo aqui (ver item 5 do pedido: a
                            oportunidade que faltava era exatamente essa,
                            hoje só dava pra marcar na finalização original). */}
                        {chamado.resolution && !chamado.resolution.isKnownSolution && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: carregandoAcao ? 'default' : 'pointer', fontSize: 12.5, color: CORES_APP.textoFraco }}>
                            <input type="checkbox" checked={marcarConhecidaAoReabrir} onChange={e => setMarcarConhecidaAoReabrir(e.target.checked)} disabled={carregandoAcao} />
                            Marcar como solução conhecida ao reabrir
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
                </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Coluna direita: feed de conversa — rolagem própria no
                desktop, independente da coluna esquerda. `position:sticky`
                + `top:0` faz ela grudar no topo do painel (que é quem rola)
                conforme a esquerda empurra a página pra baixo; maxHeight
                trava a altura dela no espaço realmente visível (painel
                menos cabeçalho, medido via ResizeObserver — ver
                alturaCabecalho), senão ela cresceria junto com a linha do
                grid, que agora acompanha a coluna esquerda sem limite.
                Com a sidebar RECOLHIDA no desktop, o espaço que sobra é
                largo demais pra ler confortavelmente — em vez de esticar
                até a borda do painel, trava a largura em 760px e centraliza
                (maxWidth + margin:auto) só nesse caso; expandida (ou no
                mobile), continua ocupando a coluna toda normalmente.

                IMPORTANTE: o `overflowY:auto` NÃO fica neste container —
                fica só no bloco da lista de comentários, logo abaixo.
                `position:sticky` e `overflow:auto` no MESMO elemento não
                se comportam bem juntos (o elemento vira seu próprio
                contexto de rolagem, o que quebra o sticky relativo ao
                ancestral rolável de verdade, que é o modal) — era isso que
                fazia o modal INTEIRO rolar, empurrando o composer
                (textarea/anexar/comentar) pra fora da área visível, em vez
                de só a lista rolar por dentro. */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0,
              position: mobile ? undefined : 'sticky',
              top: mobile ? undefined : 0,
              alignSelf: mobile ? undefined : 'start',
              // flex:1 (não grid) — ocupa o que sobrar, recalculado pelo
              // navegador a cada frame conforme a largura atual do irmão
              // (a sidebar) muda, sem precisar de nenhuma transição
              // própria aqui. Ver comentário grande na abertura da coluna
              // esquerda, acima, sobre por que isso deixou de ser grid.
              flex: mobile ? undefined : 1,
              maxHeight: mobile ? undefined : `calc(88vh - 94px - ${alturaCabecalho}px)`,
              width: !mobile && !sidebarExpandida ? '100%' : undefined,
              maxWidth: !mobile && !sidebarExpandida ? 760 : undefined,
              margin: !mobile && !sidebarExpandida ? '0 auto' : undefined,
            }}>
              {/* Só este bloco (label + lista) rola por dentro — `flex:'1
                  1 auto'` + `minHeight:0` é o que permite o overflow
                  funcionar dentro de uma coluna flex (sem minHeight:0 o
                  item nunca encolhe abaixo do próprio conteúdo, e o scroll
                  nunca chega a disparar). O composer, abaixo, fica FORA
                  deste bloco — sempre visível, nunca dentro da área que
                  rola. */}
              {/* Seletor de abas: só existe pro lado TI — colaborador nunca
                  vê "Histórico de alterações" (só técnico/suporte, conforme
                  pedido), então pra ele a coluna continua exatamente igual
                  a antes desta feature, sem esse seletor. */}
              {isIT && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {[['comentarios', 'Comentários'], ['alteracoes', 'Histórico de alterações']].map(([valor, label]) => {
                    const ativo = abaHistorico === valor
                    return (
                      <button key={valor} type="button" onClick={() => setAbaHistorico(valor)}
                        style={{ background: ativo ? 'rgba(0,73,192,0.1)' : CORES_APP.fundoCampo, color: ativo ? CORES_APP.tinta : CORES_APP.textoFraco, border: `1px solid ${ativo ? 'rgba(0,73,192,0.3)' : CORES_APP.borda}`, borderRadius: 999, padding: '6px 13px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: ativo ? 600 : 400, cursor: 'pointer' }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div style={{ flex: mobile ? undefined : '1 1 auto', minHeight: mobile ? undefined : 0, overflowY: mobile ? 'visible' : 'auto', paddingRight: mobile ? 0 : 6 }}>
                {abaHistorico === 'alteracoes' ? (
                  <>
                    <div style={estilos.label}>Histórico de alterações {logs.length > 0 && `(${logs.length})`}</div>
                    {carregandoLogs ? (
                      <div style={{ color: CORES_APP.textoFraco, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Carregando histórico...</div>
                    ) : erroLogs ? (
                      <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroLogs}</p>
                    ) : logs.length === 0 ? (
                      <div style={{ color: CORES_APP.textoSuave, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhuma alteração registrada ainda</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {logs.map(log => (
                          <div key={log.id} style={{ background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: '11px 13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                              <span style={{ color: CORES_NIVEL.fg, fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13 }}>
                                {log.userName}
                                <span style={{ marginLeft: 6, background: CORES_NIVEL.bgLog, color: CORES_NIVEL.fg, padding: '1px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, verticalAlign: 'middle' }}>{log.acaoLabel}</span>
                              </span>
                              <span style={{ color: CORES_APP.textoSuave, fontSize: 12 }}>{formatarData(log.date)} {formatarHora(log.date)}</span>
                            </div>
                            <p style={{ color: CORES_APP.texto, fontSize: 14, margin: 0, lineHeight: 1.65 }}>{log.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={estilos.label}>Histórico de comentários {comentariosReais.length > 0 && `(${comentariosReais.length})`}</div>
                    {carregandoComentarios ? (
                      <div style={{ color: CORES_APP.textoFraco, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Carregando comentários...</div>
                    ) : erroComentarios ? (
                      <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erroComentarios}</p>
                    ) : comentariosReais.length === 0 ? (
                      <div style={{ color: CORES_APP.textoSuave, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhuma atualização ainda</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {comentariosReais.map(c => (
                          <div key={c.id} style={{ background: c.internal ? CORES_NIVEL.bgComentarioInterno : CORES_APP.fundoCampo, border: `1px solid ${c.internal ? CORES_NIVEL.bordaComentarioInterno : CORES_APP.borda}`, borderRadius: 10, padding: '11px 13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                              <span style={{ color: c.internal ? CORES_NIVEL.fgClaro : CORES_APP.verde, fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13 }}>
                                {c.author}
                                {/* "Cc" identifica quem comentou como observador,
                                    não o solicitante original — evita confusão
                                    sobre quem é o dono do chamado. */}
                                {c.isObserver && (
                                  <span style={{ marginLeft: 6, background: CORES_NIVEL.bgCc, color: CORES_NIVEL.fg, padding: '1px 6px', borderRadius: 99, fontSize: 10, fontWeight: 700, verticalAlign: 'middle' }}>Cc</span>
                                )}
                                {c.internal && <span style={{ fontSize: 10, opacity: 0.75, marginLeft: 6 }}>(interno)</span>}
                              </span>
                              <span style={{ color: CORES_APP.textoSuave, fontSize: 12 }}>{formatarData(c.date)} {formatarHora(c.date)}</span>
                            </div>
                            {c.text && <p style={{ color: CORES_APP.texto, fontSize: 14, margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{c.text}</p>}
                            {/* Mesmo padrão de galeria de chamado.imagens
                                acima: 1 imagem = preview grande, 2+ = grade
                                de miniaturas, todas abrindo no mesmo
                                ImageLightbox. */}
                            {c.imagensUrls?.length > 0 && (
                              c.imagensUrls.length === 1 ? (
                                <img src={`${URL_BASE}${c.imagensUrls[0]}`} alt="Imagem anexada ao comentário" onClick={() => setImagemAmpliada(`${URL_BASE}${c.imagensUrls[0]}`)}
                                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block', marginTop: 9, cursor: 'zoom-in' }} />
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                                  {c.imagensUrls.map((url, indice) => (
                                    <img key={url} src={`${URL_BASE}${url}`} alt={`Imagem anexada ao comentário ${indice + 1}`} onClick={() => setImagemAmpliada(`${URL_BASE}${url}`)}
                                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in' }} />
                                  ))}
                                </div>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Composer — flexShrink:0 garante que nunca encolhe nem
                  entra na área de scroll acima; sempre visível, embaixo
                  do modal, independente de quantos comentários existem.
                  Escondido na aba "Histórico de alterações" — não faz
                  sentido comentar enquanto se está olhando o log
                  (somente leitura), e essa aba nem existe pro colaborador. */}
              {abaHistorico === 'comentarios' && (
              <div style={{ flexShrink: 0 }}>
              {chamadoFinalizado ? (
                <div style={{ background: CORES_APP.fundoCampo, border: `1px dashed ${CORES_APP.borda}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                  <p style={{ color: CORES_APP.textoFraco, fontSize: 13, margin: 0 }}>Chamado finalizado, reabra para comentar</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea value={textoComentario} onChange={e => setTextoComentario(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        adicionarComentarioNoChamado()
                      }
                    }}
                    onPaste={aoColarNoComentario}
                    placeholder="Escreva um comentário..." disabled={enviandoComentario}
                    style={{ ...estilos.input, minHeight: 88, resize: 'vertical', lineHeight: 1.65 }} />
                  <div>
                    <button type="button" onClick={() => !enviandoComentario && fileRefComentario.current?.click()} disabled={enviandoComentario}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: arquivosComentario.length ? 'rgba(0,179,81,0.1)' : CORES_APP.fundoCampo, color: arquivosComentario.length ? CORES_APP.verde : CORES_APP.textoFraco, border: `1px solid ${arquivosComentario.length ? 'rgba(0,120,81,0.3)' : CORES_APP.borda}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', cursor: enviandoComentario ? 'default' : 'pointer' }}>
                      <IconPaperclip width={13} height={13} />
                      {arquivosComentario.length === 0 ? 'Anexar imagem' : arquivosComentario.length === 1 ? arquivosComentario[0].name : `${arquivosComentario.length} imagens selecionadas`}
                    </button>
                    <input ref={fileRefComentario} type="file" accept="image/png, image/jpeg, image/webp" multiple style={{ display: 'none' }}
                      onChange={e => {
                        adicionarArquivosComentario(Array.from(e.target.files ?? []))
                        // Zera o input pra poder selecionar o MESMO arquivo de
                        // novo depois de removê-lo da lista (mesmo cuidado de
                        // CreateTicket.jsx/ITAbrirChamado.jsx/ResolutionModal.jsx).
                        e.target.value = ''
                      }} disabled={enviandoComentario} />
                    {arquivosComentario.length > 0 && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8,
                        ...(arquivosComentario.length >= 5 ? { maxHeight: 180, overflowY: 'auto', paddingRight: 4 } : {}),
                      }}>
                        {arquivosComentario.map((arq, indice) => (
                          <div key={`${arq.name}-${indice}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: CORES_APP.fundoCampo, borderRadius: 8, padding: '7px 10px' }}>
                            <span style={{ color: CORES_APP.texto, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arq.name}</span>
                            <button type="button" onClick={() => setArquivosComentario(prev => prev.filter((_, i) => i !== indice))} disabled={enviandoComentario}
                              title="Remover"
                              style={{ background: 'none', border: 'none', color: CORES_APP.textoSuave, fontSize: 17, lineHeight: 1, cursor: enviandoComentario ? 'default' : 'pointer', flexShrink: 0, padding: 0 }}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isIT && comentarioInterno && (
                    <p style={{ background: CORES_NIVEL.bgAviso, border: `1px solid ${CORES_NIVEL.bordaAviso}`, borderRadius: 8, padding: '8px 12px', color: CORES_NIVEL.fg, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                      Este comentário será visível só para o time de TI. O colaborador não vai vê-lo.
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {isIT ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: comentarioInterno ? CORES_NIVEL.fg : CORES_APP.textoFraco, fontSize: 13, fontWeight: comentarioInterno ? 600 : 400 }}>
                        <input type="checkbox" checked={comentarioInterno} onChange={e => setComentarioInterno(e.target.checked)} style={{ accentColor: CORES_NIVEL.fgClaro }} />
                        Comentário interno
                      </label>
                    ) : <span />}
                    <button onClick={adicionarComentarioNoChamado} disabled={enviandoComentario || (!textoComentario.trim() && arquivosComentario.length === 0)}
                      style={{ ...estilos.btnGhost, padding: '8px 18px', fontSize: 13, opacity: enviandoComentario || (!textoComentario.trim() && arquivosComentario.length === 0) ? 0.6 : 1, cursor: enviandoComentario || (!textoComentario.trim() && arquivosComentario.length === 0) ? 'default' : 'pointer' }}>
                      {enviandoImagemComentario ? 'Enviando imagens...' : enviandoComentario ? 'Enviando...' : 'Comentar'}
                    </button>
                  </div>
                </div>
              )}
              </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* AnimatePresence precisa envolver o ponto de montagem condicional
          (não o componente em si) pra conseguir animar a SAÍDA — sem
          isso, ResolutionModal some do DOM na hora que
          mostrarModalResolucao vira false, antes de qualquer exit rodar.
          Ele detecta a remoção do filho, mantém montado até a transição
          `exit` do motion.div terminar, só então desmonta de verdade.
          `key` explícita porque AnimatePresence precisa de uma pra
          rastrear identidade do filho entre renders. */}
      <AnimatePresence>
        {mostrarModalResolucao && (
          <ResolutionModal
            key="resolution-modal"
            carregando={carregandoAcao}
            onConfirm={finalizar}
            onCancel={() => setMostrarModalResolucao(false)}
          />
        )}
      </AnimatePresence>

      <ImageLightbox src={imagemAmpliada} alt="Imagem ampliada" onClose={() => setImagemAmpliada(null)} />
    </>
  )
}

export default TicketPanel
