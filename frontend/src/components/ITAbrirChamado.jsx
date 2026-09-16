import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_APP, CORES_PRIORIDADE } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { useAvisoSairSemSalvar } from '../hooks/useAvisoSairSemSalvar'
import { useEnterParaEnviar } from '../hooks/useEnterParaEnviar'
import { abrirChamadoComoTecnico, buscarColaboradores, enviarImagem } from '../services/ticketService'
import { buscarCategoriasAtivas } from '../services/categoriasService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { extrairImagemColada } from '../utils/colarImagem'
import CategoriaSelect from './CategoriaSelect'
import SolicitanteSelect from './SolicitanteSelect'
import ResumoSolicitacao from './ResumoSolicitacao'
import { IconPaperclip } from './icons'

// Mesmo limite (e mesmo raciocínio) já aplicado em
// CriarComentarioDto/TicketPanel.jsx e em CreateTicket.jsx — espelhado no
// backend via @ArrayMaxSize em CriarChamadoDto.imagensUrls.
const MAXIMO_IMAGENS = 5

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
// CreateTicket.jsx, pra bater com a densidade da Central de Chamados
// (linhas da tabela, referência de espaçamento pedida) sem mexer no
// estilos.label compartilhado, usado em telas que não pediram esse ajuste.
const rotuloCompacto = { ...estilos.label, marginBottom: 5 }

// "Abrir chamado" do lado da Área Técnica — cenário "colega ligou/pediu
// pessoalmente pro técnico abrir, sem passar pelo formulário ele mesmo".
// Mesmo formulário de CreateTicket.jsx (colaborador), só com o campo
// "Solicitante" a mais no topo e chamando POST /chamados/tecnico em vez de
// POST /chamados — o resto (upload em duas etapas, cálculo de nível no
// backend, etc.) é idêntico.
function ITAbrirChamado({ onSubmit }) {
  const { token, tratarErroApi } = useAuth()
  const [colaboradores, setColaboradores] = useState([])
  const [carregandoColaboradores, setCarregandoColaboradores] = useState(true)
  const [solicitanteId, setSolicitanteId] = useState(null)
  const [desc, setDesc] = useState('')
  const [errMsg, setErrMsg] = useState('')
  // Ver mesmo comentário em CreateTicket.jsx — lista dinâmica, não mais um
  // array fixo.
  const [categorias, setCategorias] = useState([])
  const [cat, setCat] = useState('')
  const [prio, setPrio] = useState('media')
  const [anydeskId, setAnydeskId] = useState('')
  const [arquivos, setArquivos] = useState([])
  const [etapa, setEtapa] = useState(null) // null | 'enviando-imagem' | 'criando'
  const [erro, setErro] = useState('')
  const fileRef = useRef(null)
  const largura = useWindowWidth()

  // Mesmo aviso de CreateTicket.jsx — solicitante selecionado sozinho
  // (sem nada mais preenchido) não conta como "mudança não salva".
  useAvisoSairSemSalvar(Boolean(desc.trim() || errMsg.trim() || anydeskId.trim() || arquivos.length > 0))

  useEffect(() => {
    buscarColaboradores(token)
      // Só colaboradores com conta ativa podem ser escolhidos — mesma
      // regra que o backend valida em POST /chamados/tecnico; filtrar
      // aqui também evita a pessoa escolher alguém e só descobrir que não
      // dava depois de preencher o resto do formulário.
      .then(resultado => setColaboradores(resultado.itens.filter(u => !u.emAguardoDeCadastro)))
      .catch(() => setColaboradores([]))
      .finally(() => setCarregandoColaboradores(false))
  }, [token])

  useEffect(() => {
    buscarCategoriasAtivas(token).then(lista => {
      setCategorias(lista.map(c => c.nome))
      setCat(atual => atual || lista[0]?.nome || '')
    }).catch(() => {})
  }, [token])

  // Mesmo padrão de CreateTicket.jsx (limite compartilhado entre clique e
  // paste, corta em vez de recusar tudo).
  function adicionarArquivos(novos) {
    if (novos.length === 0) return
    setArquivos(prev => {
      const espacoDisponivel = MAXIMO_IMAGENS - prev.length
      if (espacoDisponivel <= 0) {
        setErro(`Máximo de ${MAXIMO_IMAGENS} imagens por chamado`)
        return prev
      }
      if (novos.length > espacoDisponivel) {
        setErro(`Máximo de ${MAXIMO_IMAGENS} imagens por chamado — só ${espacoDisponivel} foram adicionadas`)
      }
      return [...prev, ...novos.slice(0, espacoDisponivel)]
    })
  }

  // Mesmo raciocínio de CreateTicket.jsx — capturado no card inteiro, não
  // só numa textarea específica.
  function aoColar(e) {
    const arquivo = extrairImagemColada(e)
    if (arquivo) adicionarArquivos([arquivo])
  }

  async function enviar() {
    if (!solicitanteId || !desc.trim() || !cat) return
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
      await abrirChamadoComoTecnico(token, { solicitanteId, descricao: desc, mensagemErro: errMsg, categoria: cat, prioridade: prio, imagensUrls, anydeskId })
      onSubmit()
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setEtapa(null)
    }
  }

  const aoTeclarEnter = useEnterParaEnviar(enviar)
  const carregando = etapa !== null
  const textoBotao = etapa === 'enviando-imagem' ? 'Enviando imagens...' : etapa === 'criando' ? 'Enviando chamado...' : 'Abrir chamado'
  const podeEnviar = !!solicitanteId && desc.trim() && !!cat && !carregando
  // 2/3 pro formulário, 1/3 pro resumo (proporção literal via fr, não só
  // aproximada por px) em telas largas o bastante pra caber as duas
  // colunas sem apertar (coluna direita tem mínimo de 280px) — abaixo
  // disso, empilha (mesmo padrão responsivo que o resto do app já usa via
  // useWindowWidth). `maxWidth` + `margin: auto` no wrapper do grid é
  // necessário aqui: diferente do lado colaborador (EmployeeLayout já
  // limita a largura do <main>), o ITLayout NÃO limita — sem isso, o
  // formulário esticaria a tela toda em monitores largos.
  const duasColunas = largura >= 860
  const LARGURA_MAXIMA = 1280

  return (
    <div className="animate-fade-up" style={{ maxWidth: LARGURA_MAXIMA, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 20 : 22, color: CORES_APP.tinta, margin: '0 0 4px' }}>Abrir chamado</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0, lineHeight: 1.5 }}>Abra um chamado em nome de um colaborador, para quando ele liga ou pede pessoalmente, sem passar pelo formulário.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: duasColunas ? 'minmax(0, 2fr) minmax(280px, 1fr)' : '1fr', gap: 24, alignItems: 'start' }}>
      <div onPaste={aoColar} style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.14)', padding: largura < 640 ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label style={rotuloCompacto}>Solicitante <span style={{ color: CORES_PRIORIDADE.alta.dot }}>*</span></label>
          <SolicitanteSelect
            opcoes={colaboradores}
            valor={solicitanteId}
            onChange={setSolicitanteId}
            disabled={carregando || carregandoColaboradores}
          />
        </div>
        <div>
          <label style={rotuloCompacto}>O que o colaborador precisa? <span style={{ color: CORES_PRIORIDADE.alta.dot }}>*</span></label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={aoTeclarEnter} placeholder="Ex: impressora do setor não imprime, aparece 'sem papel' mas tem papel na bandeja"
            style={{ ...campoCompacto, minHeight: 96, maxHeight: 200, overflow: 'auto', resize: 'vertical', lineHeight: 1.5 }} disabled={carregando} />
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
                adicionarArquivos(Array.from(e.target.files ?? []))
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
          {/* Mesmo filtro de CreateTicket.jsx — só dígitos, removidos a
              cada tecla em vez de validados só no envio. */}
          <input value={anydeskId} onChange={e => setAnydeskId(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Ex: 123456789" style={campoCompacto} disabled={carregando} />
          <p style={{ color: CORES_APP.textoSuave, fontSize: 12, margin: '4px 0 0' }}>Fica visível na tela inicial do AnyDesk.</p>
        </div>
        {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}
        <button onClick={enviar} disabled={!podeEnviar}
          style={{ ...estilos.btnPrimary, padding: '11px 28px', opacity: podeEnviar ? 1 : 0.45, cursor: podeEnviar ? 'pointer' : 'not-allowed', fontSize: 15 }}>
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

export default ITAbrirChamado
