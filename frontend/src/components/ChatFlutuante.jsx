import { useState } from 'react'
import { CORES_APP } from '../styles/theme'
import { IconMessageCircle, IconSend, IconX } from './icons'

// Casca visual do futuro assistente virtual — SEM lógica nenhuma de
// backend ainda (sem chamada de API, sem Ollama, sem IA). O histórico de
// mensagens é só estado local (useState), nunca persiste (some ao
// recarregar a página, igual o resto da sessão) e nunca sai daqui — é só
// pra já ter o "encaixe" visual pronto pra quando a lógica de verdade for
// plugada (bastaria trocar `enviar()` por uma chamada de API que devolve
// a resposta do assistente, no mesmo padrão de mensagem já usado aqui).
const MENSAGEM_PLACEHOLDER = 'Assistente em construção — em breve vou te ajudar com dúvidas comuns.'

function ChatFlutuante() {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState([
    { id: 'placeholder', autor: 'assistente', texto: MENSAGEM_PLACEHOLDER },
  ])
  const [texto, setTexto] = useState('')

  // Só ecoa a mensagem na tela (nunca envia pra lugar nenhum) — dá pra ver
  // a "forma" de uma conversa funcionando, sem prometer uma resposta de
  // verdade que ainda não existe.
  function enviar() {
    if (!texto.trim()) return
    setMensagens((atual) => [...atual, { id: crypto.randomUUID(), autor: 'usuario', texto: texto.trim() }])
    setTexto('')
  }

  return (
    <>
      {aberto && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 70,
          width: 340, maxWidth: 'calc(100vw - 32px)', height: 460, maxHeight: 'calc(100vh - 140px)',
          background: CORES_APP.card, border: `1px solid ${CORES_APP.borda}`, borderRadius: 16,
          boxShadow: '0 12px 32px rgba(16,35,31,0.22)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${CORES_APP.bordaSuave}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#007851', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <IconMessageCircle width={15} height={15} />
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: CORES_APP.tinta }}>Assistente Novatech</span>
            </div>
            <button type="button" onClick={() => setAberto(false)} title="Fechar"
              style={{ background: 'none', border: 'none', color: CORES_APP.textoFraco, cursor: 'pointer', display: 'flex', padding: 4 }}>
              <IconX width={16} height={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mensagens.map((m) => (
              <div key={m.id} style={{
                alignSelf: m.autor === 'usuario' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '9px 12px', borderRadius: 12,
                fontSize: 13.5, lineHeight: 1.5,
                background: m.autor === 'usuario' ? '#007851' : CORES_APP.fundoCampo,
                color: m.autor === 'usuario' ? '#fff' : CORES_APP.texto,
                borderBottomRightRadius: m.autor === 'usuario' ? 3 : 12,
                borderBottomLeftRadius: m.autor === 'usuario' ? 12 : 3,
              }}>
                {m.texto}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderTop: `1px solid ${CORES_APP.bordaSuave}`, flexShrink: 0 }}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }}
              placeholder="Escreva sua dúvida..."
              style={{ flex: 1, background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: '10px 12px', color: CORES_APP.texto, fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={enviar} disabled={!texto.trim()} title="Enviar"
              style={{
                width: 36, height: 36, borderRadius: 9, border: 'none', flexShrink: 0,
                background: texto.trim() ? '#007851' : CORES_APP.fundoCampo,
                color: texto.trim() ? '#fff' : CORES_APP.textoSuave,
                cursor: texto.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}>
              <IconSend width={15} height={15} />
            </button>
          </div>
        </div>
      )}

      <button type="button" onClick={() => setAberto((v) => !v)} title={aberto ? 'Fechar assistente' : 'Abrir assistente'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 70,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: '#007851', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,120,81,0.4)', transition: 'transform 0.15s',
        }}>
        {aberto ? <IconX width={22} height={22} /> : <IconMessageCircle width={22} height={22} />}
      </button>
    </>
  )
}

export default ChatFlutuante
