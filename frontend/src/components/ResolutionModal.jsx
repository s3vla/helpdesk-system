import { useRef, useState } from 'react'
import { estilos } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { enviarImagem } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { IconPaperclip } from './icons'

// Modal exibido ao finalizar um chamado, para registrar "como foi
// resolvido". Não recebe mais `resolvidoPor` — o backend sempre usa quem
// está autenticado no token pra isso (ver PATCH /chamados/:id/status),
// nunca um valor vindo do front.
//
// Print da solução (opcional) reaproveita exatamente o mesmo padrão de
// upload em duas etapas do formulário de abertura de chamado (CreateTicket):
// primeiro sobe o arquivo (POST /uploads), só depois confirma a finalização
// com a URL recebida.
function ResolutionModal({ carregando: carregandoExterno, onConfirm, onCancel }) {
  const { token, tratarErroApi } = useAuth()
  const [texto, setTexto] = useState('')
  const [solucaoConhecida, setSolucaoConhecida] = useState(false)
  const [arquivo, setArquivo] = useState(null)
  const [etapa, setEtapa] = useState(null) // null | 'enviando-imagem'
  const [erro, setErro] = useState('')
  const fileRef = useRef(null)
  const pronto = texto.trim().length > 0
  const carregando = carregandoExterno || etapa !== null

  async function confirmar() {
    if (!pronto || carregando) return
    setErro('')
    try {
      let imagemUrlSolucao
      if (arquivo) {
        setEtapa('enviando-imagem')
        imagemUrlSolucao = await enviarImagem(token, arquivo)
        setEtapa(null)
      }
      // Precisa aguardar: onConfirm (finalizar, em TicketPanel) é assíncrono
      // e agora relança em caso de erro — sem esse await, o catch abaixo
      // nunca veria a falha, e o modal fecharia (ou pareceria travado) sem
      // explicar o que deu errado.
      await onConfirm({ texto: texto.trim(), solucaoConhecida, imagemUrlSolucao })
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setEtapa(null)
    }
  }

  const textoBotao = etapa === 'enviando-imagem' ? 'Enviando imagem...' : carregandoExterno ? 'Finalizando...' : 'Confirmar e finalizar'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(4,10,22,0.7)', backdropFilter: 'blur(6px)' }} onClick={onCancel}>
      <div style={{ background: '#0d1b34', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: '28px 26px', width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 18 }}
        onClick={e => e.stopPropagation()} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✓</div>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: '#f0f4ff', margin: 0 }}>Registrar resolução</h3>
            <p style={{ color: '#7b92b4', fontSize: 12, margin: 0, marginTop: 2 }}>Documente como o problema foi resolvido antes de finalizar</p>
          </div>
        </div>

        <div>
          <label style={estilos.label}>Como foi resolvido? <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea
            value={texto} onChange={e => setTexto(e.target.value)} autoFocus disabled={carregando}
            placeholder="Descreva a causa do problema e os passos que resolveram. Seja específico – isso vai ajudar na próxima vez que o problema aparecer."
            style={{ ...estilos.input, minHeight: 110, resize: 'vertical', lineHeight: 1.7, fontSize: 14 }}
          />
        </div>

        <div>
          <label style={estilos.label}>Print da solução <span style={{ color: '#4a5f7a', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span></label>
          <div onClick={() => !carregando && fileRef.current?.click()}
            style={{ border: `2px dashed ${arquivo ? 'rgba(0,120,81,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '22px', textAlign: 'center', cursor: carregando ? 'default' : 'pointer', background: arquivo ? 'rgba(0,179,81,0.05)' : 'transparent', transition: 'all 0.2s' }}>
            <div style={{ marginBottom: 6, color: arquivo ? '#00b351' : '#7b92b4', display: 'flex', justifyContent: 'center' }}>
              <IconPaperclip width={22} height={22} />
            </div>
            <div style={{ color: arquivo ? '#00b351' : '#7b92b4', fontSize: 14 }}>{arquivo ? `${arquivo.name} — clique para trocar` : 'Clique para anexar imagem'}</div>
            <input ref={fileRef} type="file" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }}
              onChange={e => setArquivo(e.target.files?.[0] ?? null)} disabled={carregando} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'pointer', background: solucaoConhecida ? 'rgba(0,179,81,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${solucaoConhecida ? 'rgba(0,120,81,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '13px 14px' }}>
          <input type="checkbox" checked={solucaoConhecida} onChange={e => setSolucaoConhecida(e.target.checked)} disabled={carregando}
            style={{ accentColor: '#00b351', marginTop: 2, flexShrink: 0, width: 15, height: 15 }} />
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: solucaoConhecida ? '#00b351' : '#f0f4ff', marginBottom: 2 }}>Marcar como solução conhecida</div>
            <div style={{ fontSize: 12, color: '#7b92b4', lineHeight: 1.5 }}>Este tipo de problema pode se repetir. A solução ficará disponível na base de Soluções Conhecidas para referência futura.</div>
          </div>
        </label>

        {erro && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={confirmar} disabled={!pronto || carregando}
            style={{ ...estilos.btnPrimary, background: pronto ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34,197,94,0.2)', color: pronto ? '#fff' : '#4a5f7a', cursor: pronto && !carregando ? 'pointer' : 'not-allowed', flex: 1, opacity: carregando ? 0.7 : 1 }}>
            {textoBotao}
          </button>
          <button onClick={onCancel} disabled={carregando}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#7b92b4', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px 18px', fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: carregando ? 'default' : 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResolutionModal
