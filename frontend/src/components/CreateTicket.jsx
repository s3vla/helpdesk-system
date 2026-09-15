import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_PRIORIDADE, CORES_APP, CORES_TI } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { useAvisoSairSemSalvar } from '../hooks/useAvisoSairSemSalvar'
import { useEnterParaEnviar } from '../hooks/useEnterParaEnviar'
import { criarChamado, enviarImagem, buscarChamadosSemelhantes, buscarChamado } from '../services/ticketService'
import { buscarCategoriasAtivas } from '../services/categoriasService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import CategoriaSelect from './CategoriaSelect'
import ResumoSolicitacao from './ResumoSolicitacao'
import { IconPaperclip, IconInfo } from './icons'

// Tamanho mínimo de descrição antes de checar semelhantes — bate com
// @MinLength(5) de VerificarSemelhantesDto no backend, sem sentido
// disparar a chamada antes disso.
const TAMANHO_MINIMO_BUSCA_SEMELHANTES = 5
const PRIORIDADES = [
  { valor: 'baixa', label: 'Baixa', cor: CORES_PRIORIDADE.baixa.dot },
  { valor: 'media', label: 'Média', cor: CORES_PRIORIDADE.media.dot },
  { valor: 'alta', label: 'Alta', cor: CORES_PRIORIDADE.alta.fg },
]

// Mesmo tamanho de estilos.input (compactar demais deixou os campos
// "achatados" — voltado ao padrão, só mantido como const local pro caso de
// precisar customizar de novo sem mexer no estilos.input compartilhado).
const campoCompacto = { ...estilos.input, padding: '13px 14px', fontSize: 15 }
// Idem pro rótulo — marginBottom menor que estilos.label (7), só aqui e em
// ITAbrirChamado.jsx, pra bater com a densidade da Central de Chamados
// (linhas da tabela, referência de espaçamento pedida) sem mexer no
// estilos.label compartilhado, usado em telas que não pediram esse ajuste.
const rotuloCompacto = { ...estilos.label, marginBottom: 5 }

// Formulário "Abrir chamado". Categoria e prioridade são estado controlado
// (useState + comparação `cat === c` para destacar o botão ativo) — o valor
// que vai para criarChamado() é sempre o mesmo `cat`/`prio` renderizado na
// tela no momento do clique em "Enviar", então o que o usuário vê selecionado
// aqui é garantidamente o que chega no backend (bug do protótipo original
// corrigido: lá a categoria enviada podia divergir da exibida).
//
// Envio de imagem acontece em duas etapas: primeiro sobe o arquivo
// (POST /uploads), só depois cria o chamado com a URL recebida — por isso
// o botão mostra dois estágios de carregamento diferentes.
function CreateTicket({ onSubmit, onSelect }) {
  const { token, tratarErroApi } = useAuth()
  const [desc, setDesc] = useState('')
  const [errMsg, setErrMsg] = useState('')
  // Categorias ativas buscadas do backend — não é mais um array fixo (ver
  // Administração → Categorias). `cat` começa vazio e é preenchido com a
  // primeira categoria ativa assim que a lista chega, em vez de um literal
  // "Hardware" que poderia nem existir mais se o técnico desativasse essa
  // categoria específica.
  const [categorias, setCategorias] = useState([])
  const [cat, setCat] = useState('')
  const [prio, setPrio] = useState('media')
  const [anydeskId, setAnydeskId] = useState('')
  const [arquivos, setArquivos] = useState([])
  const [etapa, setEtapa] = useState(null) // null | 'enviando-imagem' | 'criando'
  const [erro, setErro] = useState('')
  const [semelhantes, setSemelhantes] = useState([])
  const fileRef = useRef(null)
  const debounceSemelhantesRef = useRef(null)
  const largura = useWindowWidth()

  // Avisa antes de fechar a aba/recarregar só enquanto tiver algo digitado
  // ou anexado que ainda não foi enviado — formulário vazio não dispara
  // aviso nenhum (ver useAvisoSairSemSalvar).
  useAvisoSairSemSalvar(Boolean(desc.trim() || errMsg.trim() || anydeskId.trim() || arquivos.length > 0))

  useEffect(() => {
    buscarCategoriasAtivas(token).then(lista => {
      setCategorias(lista.map(c => c.nome))
      setCat(atual => atual || lista[0]?.nome || '')
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aviso não-bloqueante de "você já tem algo parecido em aberto" —
  // debounce (mesmo padrão já usado em ITSolutions.jsx pra busca):
  // espera parar de digitar antes de checar, pra não disparar uma
  // requisição a cada tecla. Só verifica com categoria escolhida e
  // descrição com tamanho mínimo — abaixo disso, nem tenta (texto curto
  // demais não tem sinal nenhum de similaridade, ver
  // TAMANHO_MINIMO_BUSCA_SEMELHANTES).
  useEffect(() => {
    clearTimeout(debounceSemelhantesRef.current)
    if (desc.trim().length < TAMANHO_MINIMO_BUSCA_SEMELHANTES || !cat) {
      setSemelhantes([])
      return
    }
    debounceSemelhantesRef.current = setTimeout(() => {
      buscarChamadosSemelhantes(token, { categoria: cat, texto: desc.trim() })
        .then(setSemelhantes)
        .catch(() => setSemelhantes([])) // nunca atrapalha o preenchimento por causa disso
    }, 500)
    return () => clearTimeout(debounceSemelhantesRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desc, cat])

  // O aviso só tem {id, titulo, status} (resposta enxuta de
  // verificar-semelhantes) — TicketPanel espera o chamado MAPEADO
  // completo (mesmo formato que MyTickets/AcompanhandoTickets já
  // passam), então busca os dados de verdade antes de abrir o painel,
  // em vez de empurrar um objeto parcial que deixaria a maioria dos
  // campos undefined na primeira renderização.
  async function abrirSemelhante(id) {
    try {
      const chamado = await buscarChamado(token, id)
      onSelect?.(chamado)
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    }
  }

  async function enviar() {
    if (!desc.trim() || !cat) return
    setErro('')
    try {
      const imagensUrls = []
      if (arquivos.length > 0) {
        setEtapa('enviando-imagem')
        // Sequencial (não Promise.all) — evita disparar todos os uploads
        // de uma vez pro mesmo endpoint; mais fácil de estender depois pra
        // mostrar progresso tipo "2 de 5", se um dia for preciso.
        for (const arquivo of arquivos) {
          imagensUrls.push(await enviarImagem(token, arquivo))
        }
      }
      setEtapa('criando')
      await criarChamado(token, { descricao: desc, mensagemErro: errMsg, categoria: cat, prioridade: prio, imagensUrls, anydeskId })
      onSubmit()
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setEtapa(null)
    }
  }

  const aoTeclarEnter = useEnterParaEnviar(enviar)
  const carregando = etapa !== null
  const textoBotao = etapa === 'enviando-imagem' ? 'Enviando imagens...' : etapa === 'criando' ? 'Enviando chamado...' : 'Enviar chamado'
  // 2/3 pro formulário, 1/3 pro resumo (proporção literal via fr, não só
  // aproximada por px) em telas largas o bastante pra caber as duas
  // colunas sem apertar (coluna direita tem mínimo de 280px) — abaixo
  // disso, empilha (mesmo padrão responsivo que o resto do app já usa via
  // useWindowWidth). `maxWidth` + `margin: auto` no wrapper do grid (em vez
  // de só confiar no container do layout pai) garante o mesmo teto de
  // largura tanto aqui (colaborador, cujo EmployeeLayout já limita) quanto
  // em ITAbrirChamado.jsx (área técnica, cujo ITLayout NÃO limita a
  // largura do <main> — sem isso, o formulário esticaria a tela toda em
  // monitores largos).
  const duasColunas = largura >= 860
  const LARGURA_MAXIMA = 1280

  return (
    <div className="animate-fade-up" style={{ maxWidth: LARGURA_MAXIMA, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 20 : 22, color: CORES_APP.tinta, margin: '0 0 4px' }}>Abrir chamado</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0, lineHeight: 1.5 }}>Descreva o problema que você está enfrentando. O Time de TI entrará em contato.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: duasColunas ? 'minmax(0, 2fr) minmax(280px, 1fr)' : '1fr', gap: 24, alignItems: 'start' }}>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.14)', padding: largura < 640 ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={rotuloCompacto}>O que você precisa? <span style={{ color: CORES_PRIORIDADE.alta.dot }}>*</span></label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={aoTeclarEnter} placeholder="Ex: impressora do setor não imprime, aparece 'sem papel' mas tem papel na bandeja"
            style={{ ...campoCompacto, minHeight: 96, maxHeight: 200, overflowY: 'auto', resize: 'vertical', lineHeight: 1.5 }} disabled={carregando} />
          {/* Só informativo, nunca bloqueia — colaborador pode ignorar e
              seguir abrindo o chamado novo normalmente. Só olha pros
              PRÓPRIOS chamados ainda abertos (o backend garante isso via
              token, ver ChamadosService.buscarSemelhantesDoUsuario). */}
          {semelhantes.length > 0 && (
            <div style={{ marginTop: 10, background: CORES_TI.accentBg, border: `1px solid ${CORES_TI.accentBorda}`, borderRadius: 10, padding: '11px 13px', display: 'flex', gap: 9 }}>
              <span style={{ color: CORES_TI.accent, flexShrink: 0, display: 'flex', marginTop: 1 }}><IconInfo width={15} height={15} /></span>
              <div style={{ fontSize: 12.5, color: CORES_APP.texto, lineHeight: 1.5 }}>
                Você já tem {semelhantes.length > 1 ? 'chamados parecidos em aberto' : 'um chamado parecido em aberto'}:
                {' '}
                {semelhantes.map((s, indice) => (
                  <span key={s.id}>
                    <button type="button" onClick={() => abrirSemelhante(s.id)}
                      style={{ background: 'none', border: 'none', padding: 0, color: CORES_TI.accent, fontWeight: 600, fontSize: 12.5, textDecoration: 'underline', cursor: 'pointer' }}>
                      "{s.titulo}"
                    </button>
                    {indice < semelhantes.length - 1 ? ', ' : ''}
                  </span>
                ))}
, quer conferir antes de abrir outro?
              </div>
            </div>
          )}
        </div>
        <div>
          <label style={rotuloCompacto}>Qual mensagem de erro apareceu?</label>
          <input value={errMsg} onChange={e => setErrMsg(e.target.value)} placeholder="Ex: 'Acesso negado', tela azul do Windows, ou a mensagem exata que apareceu" style={campoCompacto} disabled={carregando} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: largura < 500 ? '1fr' : '1fr 1fr', gap: 10 }}>
          <div>
            <label style={rotuloCompacto}>Categoria</label>
            <CategoriaSelect opcoes={categorias} valor={cat} onChange={setCat} disabled={carregando} />
          </div>
          <div>
            <label style={rotuloCompacto}>Prioridade</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {PRIORIDADES.map(p => (
                <button key={p.valor} type="button" onClick={() => setPrio(p.valor)} disabled={carregando}
                  style={{
                    background: prio === p.valor ? `color-mix(in srgb, ${p.cor} 10%, transparent)` : CORES_APP.fundoCampo,
                    color: prio === p.valor ? p.cor : CORES_APP.textoFraco,
                    border: `1px solid ${prio === p.valor ? `color-mix(in srgb, ${p.cor} 30%, transparent)` : CORES_APP.borda}`,
                    borderRadius: 7, padding: '11px 12px', fontSize: 13.5, fontFamily: 'Outfit, sans-serif',
                    fontWeight: prio === p.valor ? 600 : 400, cursor: 'pointer', flex: 1, transition: 'all 0.15s',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label style={rotuloCompacto}>Prints do erro</label>
          <div onClick={() => !carregando && fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px dashed ${arquivos.length ? 'rgba(0,120,81,0.4)' : CORES_APP.borda}`, borderRadius: 10, padding: '22px 14px', textAlign: 'center', cursor: carregando ? 'default' : 'pointer', background: arquivos.length ? 'rgba(0,179,81,0.05)' : 'transparent', transition: 'all 0.2s' }}>
            <span style={{ color: arquivos.length ? CORES_APP.verde : CORES_APP.textoFraco, display: 'flex', flexShrink: 0 }}>
              <IconPaperclip width={16} height={16} />
            </span>
            <span style={{ color: arquivos.length ? CORES_APP.verde : CORES_APP.textoFraco, fontSize: 13 }}>
              {arquivos.length ? `${arquivos.length} ${arquivos.length > 1 ? 'imagens' : 'imagem'} selecionada${arquivos.length > 1 ? 's' : ''}, clique para adicionar mais` : 'Clique para anexar imagens'}
            </span>
            <input ref={fileRef} type="file" accept="image/png, image/jpeg, image/webp" multiple style={{ display: 'none' }}
              onChange={e => {
                const novos = Array.from(e.target.files ?? [])
                if (novos.length) setArquivos(prev => [...prev, ...novos])
                // Zera o input pra poder selecionar o MESMO arquivo de novo
                // depois de removê-lo da lista (senão o navegador ignora,
                // já que o valor "não mudou" do ponto de vista dele).
                e.target.value = ''
              }} disabled={carregando} />
          </div>
          {arquivos.length > 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8,
              // A partir de 5 imagens, trava a altura (~5 itens visíveis, ver
              // cálculo de item abaixo) e passa a rolar em vez de empurrar o
              // resto do formulário pra baixo. Com menos de 5, sem limite —
              // comportamento natural de sempre.
              ...(arquivos.length >= 5 ? { maxHeight: 180, overflowY: 'auto', paddingRight: 4 } : {}),
            }}>
              {arquivos.map((arq, indice) => (
                <div key={`${arq.name}-${indice}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: CORES_APP.fundoCampo, borderRadius: 8, padding: '7px 10px' }}>
                  <span style={{ color: CORES_APP.texto, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arq.name}</span>
                  <button type="button" onClick={() => setArquivos(prev => prev.filter((_, i) => i !== indice))} disabled={carregando}
                    title="Remover"
                    style={{ background: 'none', border: 'none', color: CORES_APP.textoSuave, fontSize: 17, lineHeight: 1, cursor: carregando ? 'default' : 'pointer', flexShrink: 0, padding: 0 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={rotuloCompacto}>ID do AnyDesk (para acesso remoto)</label>
          {/* ID do AnyDesk é só numérico — remove qualquer caractere que não
              seja dígito a cada tecla, em vez de deixar digitar e validar só
              no envio (a pessoa vê na hora que a letra não "pegou", sem
              precisar de mensagem de erro pra isso). */}
          <input value={anydeskId} onChange={e => setAnydeskId(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Ex: 123456789" style={campoCompacto} disabled={carregando} />
          <p style={{ color: CORES_APP.textoSuave, fontSize: 12, margin: '4px 0 0' }}>Fica visível na tela inicial do AnyDesk.</p>
        </div>
        {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}
        <button onClick={enviar} disabled={!desc.trim() || !cat || carregando}
          style={{ ...estilos.btnPrimary, padding: '11px 28px', opacity: desc.trim() && cat && !carregando ? 1 : 0.45, cursor: desc.trim() && cat && !carregando ? 'pointer' : 'not-allowed', fontSize: 15 }}>
          {textoBotao}
        </button>
      </div>
      <div style={duasColunas ? { position: 'sticky', top: 20 } : undefined}>
        <ResumoSolicitacao categoria={cat} prioridade={prio} arquivos={arquivos} />
      </div>
      </div>
    </div>
  )
}

export default CreateTicket
