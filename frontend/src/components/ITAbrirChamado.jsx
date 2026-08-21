import { useEffect, useRef, useState } from 'react'
import { estilos, CORES_APP, CORES_PRIORIDADE } from '../styles/theme'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { useAuth } from '../hooks/useAuth'
import { abrirChamadoComoTecnico, buscarColaboradores, enviarImagem } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import CategoriaSelect from './CategoriaSelect'
import SolicitanteSelect from './SolicitanteSelect'
import { IconPaperclip } from './icons'

const PRIORIDADES = [
  { valor: 'baixa', label: 'Baixa', cor: CORES_PRIORIDADE.baixa.dot },
  { valor: 'media', label: 'Média', cor: CORES_PRIORIDADE.media.dot },
  { valor: 'alta', label: 'Alta', cor: CORES_PRIORIDADE.alta.fg },
]

// Versão mais compacta de estilos.input, só pra este formulário e pro
// CreateTicket.jsx (mesmo padrão visual) — não mexe no estilos.input
// compartilhado porque outras telas (ResolutionModal, TrocarSenhaModal
// etc.) usam o tamanho original e não foram pedidas nesse ajuste.
const campoCompacto = { ...estilos.input, padding: '10px 12px', fontSize: 14 }

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
  const [cat, setCat] = useState('Hardware')
  const [prio, setPrio] = useState('media')
  const [anydeskId, setAnydeskId] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [etapa, setEtapa] = useState(null) // null | 'enviando-imagem' | 'criando'
  const [erro, setErro] = useState('')
  const fileRef = useRef(null)
  const largura = useWindowWidth()

  useEffect(() => {
    buscarColaboradores(token)
      // Só colaboradores com conta ativa podem ser escolhidos — mesma
      // regra que o backend valida em POST /chamados/tecnico; filtrar
      // aqui também evita a pessoa escolher alguém e só descobrir que não
      // dava depois de preencher o resto do formulário.
      .then(usuarios => setColaboradores(usuarios.filter(u => !u.emAguardoDeCadastro)))
      .catch(() => setColaboradores([]))
      .finally(() => setCarregandoColaboradores(false))
  }, [token])

  async function enviar() {
    if (!solicitanteId || !desc.trim()) return
    setErro('')
    try {
      let imagemUrl
      if (arquivo) {
        setEtapa('enviando-imagem')
        imagemUrl = await enviarImagem(token, arquivo)
      }
      setEtapa('criando')
      await abrirChamadoComoTecnico(token, { solicitanteId, descricao: desc, mensagemErro: errMsg, categoria: cat, prioridade: prio, imagemUrl, anydeskId })
      onSubmit()
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setEtapa(null)
    }
  }

  const carregando = etapa !== null
  const textoBotao = etapa === 'enviando-imagem' ? 'Enviando imagem...' : etapa === 'criando' ? 'Enviando chamado...' : 'Abrir chamado'
  const podeEnviar = !!solicitanteId && desc.trim() && !carregando

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: largura < 640 ? 20 : 22, color: CORES_APP.tinta, margin: '0 0 4px' }}>Abrir chamado</h1>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0, lineHeight: 1.5 }}>Abra um chamado em nome de um colaborador — para quando ele liga ou pede pessoalmente, sem passar pelo formulário.</p>
      </div>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.14)', padding: largura < 640 ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={estilos.label}>Solicitante <span style={{ color: '#ef4444' }}>*</span></label>
          <SolicitanteSelect
            opcoes={colaboradores}
            valor={solicitanteId}
            onChange={setSolicitanteId}
            disabled={carregando || carregandoColaboradores}
          />
        </div>
        <div>
          <label style={estilos.label}>O que o colaborador precisa? <span style={{ color: '#ef4444' }}>*</span></label>
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
        <button onClick={enviar} disabled={!podeEnviar}
          style={{ ...estilos.btnPrimary, padding: '11px 28px', opacity: podeEnviar ? 1 : 0.45, cursor: podeEnviar ? 'pointer' : 'not-allowed', fontSize: 15 }}>
          {textoBotao}
        </button>
      </div>
    </div>
  )
}

export default ITAbrirChamado
