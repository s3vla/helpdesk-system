import { useRef, useState } from 'react'
import { estilos, CORES_PRIORIDADE, CORES_APP } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { criarChamado, enviarImagem } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import CategoriaSelect from './CategoriaSelect'
import { IconPaperclip } from './icons'
const PRIORIDADES = [
  { valor: 'baixa', label: 'Baixa', cor: CORES_PRIORIDADE.baixa.dot },
  { valor: 'media', label: 'Média', cor: CORES_PRIORIDADE.media.dot },
  { valor: 'alta', label: 'Alta', cor: CORES_PRIORIDADE.alta.fg },
]

// Versão mais compacta de estilos.input, só pra este formulário e pro
// ITAbrirChamado.jsx (mesmo padrão visual) — não mexe no estilos.input
// compartilhado porque outras telas (ResolutionModal, TrocarSenhaModal
// etc.) usam o tamanho original e não foram pedidas nesse ajuste.
const campoCompacto = { ...estilos.input, padding: '10px 12px', fontSize: 14 }

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
function CreateTicket({ onSubmit }) {
  const { token, tratarErroApi } = useAuth()
  const [desc, setDesc] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [cat, setCat] = useState('Hardware')
  const [prio, setPrio] = useState('media')
  const [anydeskId, setAnydeskId] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [etapa, setEtapa] = useState(null) // null | 'enviando-imagem' | 'criando'
  const [erro, setErro] = useState('')
  const fileRef = useRef(null)
  const largura = useWindowWidth()

  async function enviar() {
    if (!desc.trim()) return
    setErro('')
    try {
      let imagemUrl
      if (arquivo) {
        setEtapa('enviando-imagem')
        imagemUrl = await enviarImagem(token, arquivo)
      }
      setEtapa('criando')
      await criarChamado(token, { descricao: desc, mensagemErro: errMsg, categoria: cat, prioridade: prio, imagemUrl, anydeskId })
      onSubmit()
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setEtapa(null)
    }
  }

  const carregando = etapa !== null
  const textoBotao = etapa === 'enviando-imagem' ? 'Enviando imagem...' : etapa === 'criando' ? 'Enviando chamado...' : 'Enviar chamado'

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 20 : 22, color: CORES_APP.tinta, margin: '0 0 4px' }}>Abrir chamado</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0, lineHeight: 1.5 }}>Descreva o problema que você está enfrentando. O Time de TI entrará em contato.</p>
      </div>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.14)', padding: largura < 640 ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={estilos.label}>O que você precisa? <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva o problema com o máximo de detalhes possível..."
            style={{ ...campoCompacto, minHeight: 76, resize: 'vertical', lineHeight: 1.5 }} disabled={carregando} />
        </div>
        <div>
          <label style={estilos.label}>Qual mensagem de erro apareceu? <span style={{ color: CORES_APP.textoSuave, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span></label>
          <input value={errMsg} onChange={e => setErrMsg(e.target.value)} placeholder="Ex: Erro 404, tela azul, acesso negado..." style={campoCompacto} disabled={carregando} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: largura < 500 ? '1fr' : '1fr 1fr', gap: 14 }}>
          <div>
            <label style={estilos.label}>Categoria</label>
            <CategoriaSelect valor={cat} onChange={setCat} disabled={carregando} />
          </div>
          <div>
            <label style={estilos.label}>Prioridade</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {PRIORIDADES.map(p => (
                <button key={p.valor} type="button" onClick={() => setPrio(p.valor)} disabled={carregando}
                  style={{
                    background: prio === p.valor ? `${p.cor}1a` : CORES_APP.fundoCampo,
                    color: prio === p.valor ? p.cor : CORES_APP.textoFraco,
                    border: `1px solid ${prio === p.valor ? `${p.cor}4d` : CORES_APP.borda}`,
                    borderRadius: 7, padding: '8px 10px', fontSize: 12.5, fontFamily: 'Outfit, sans-serif',
                    fontWeight: prio === p.valor ? 600 : 400, cursor: 'pointer', flex: 1, transition: 'all 0.15s',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label style={estilos.label}>Print do erro <span style={{ color: CORES_APP.textoSuave, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span></label>
          <div onClick={() => !carregando && fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px dashed ${arquivo ? 'rgba(0,120,81,0.4)' : CORES_APP.borda}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center', cursor: carregando ? 'default' : 'pointer', background: arquivo ? 'rgba(0,179,81,0.05)' : 'transparent', transition: 'all 0.2s' }}>
            <span style={{ color: arquivo ? '#00b351' : CORES_APP.textoFraco, display: 'flex', flexShrink: 0 }}>
              <IconPaperclip width={16} height={16} />
            </span>
            <span style={{ color: arquivo ? '#00b351' : CORES_APP.textoFraco, fontSize: 13 }}>{arquivo ? `${arquivo.name} — clique para trocar` : 'Clique para anexar imagem'}</span>
            <input ref={fileRef} type="file" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }}
              onChange={e => setArquivo(e.target.files?.[0] ?? null)} disabled={carregando} />
          </div>
        </div>
        <div>
          <label style={estilos.label}>ID do AnyDesk (para acesso remoto) <span style={{ color: CORES_APP.textoSuave, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span></label>
          <input value={anydeskId} onChange={e => setAnydeskId(e.target.value)} placeholder="Ex: 123 456 789" style={campoCompacto} disabled={carregando} />
          <p style={{ color: CORES_APP.textoSuave, fontSize: 12, margin: '4px 0 0' }}>Fica visível na tela inicial do AnyDesk.</p>
        </div>
        {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}
        <button onClick={enviar} disabled={!desc.trim() || carregando}
          style={{ ...estilos.btnPrimary, padding: '11px 28px', opacity: desc.trim() && !carregando ? 1 : 0.45, cursor: desc.trim() && !carregando ? 'pointer' : 'not-allowed', fontSize: 15 }}>
          {textoBotao}
        </button>
      </div>
    </div>
  )
}

export default CreateTicket
