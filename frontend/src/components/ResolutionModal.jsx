import { useRef, useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { enviarImagem } from '../services/ticketService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { IconPaperclip } from './icons'

// Modal exibido ao finalizar um chamado, para registrar "como foi
// resolvido". Não recebe mais `resolvidoPor` — o backend sempre usa quem
// está autenticado no token pra isso (ver PATCH /chamados/:id/status),
// nunca um valor vindo do front.
//
// Prints da solução (opcional, múltiplos) reaproveitam exatamente o mesmo
// padrão de upload de CreateTicket.jsx: multi-seleção, lista de arquivos
// com remoção individual (com scroll a partir de 5), upload sequencial
// (não Promise.all) em POST /uploads, só então confirma a finalização com
// as URLs recebidas.
function ResolutionModal({ carregando: carregandoExterno, onConfirm, onCancel }) {
  const { token, tratarErroApi } = useAuth()
  const [texto, setTexto] = useState('')
  const [solucaoConhecida, setSolucaoConhecida] = useState(false)
  const [arquivos, setArquivos] = useState([])
  const [etapa, setEtapa] = useState(null) // null | 'enviando-imagem'
  const [erro, setErro] = useState('')
  const fileRef = useRef(null)
  const pronto = texto.trim().length > 0
  const carregando = carregandoExterno || etapa !== null

  async function confirmar() {
    if (!pronto || carregando) return
    setErro('')
    try {
      const imagensUrlsSolucao = []
      if (arquivos.length > 0) {
        setEtapa('enviando-imagem')
        // Sequencial (não Promise.all) — mesmo motivo de CreateTicket.jsx:
        // evita disparar todos os uploads de uma vez pro mesmo endpoint.
        for (const arquivo of arquivos) {
          imagensUrlsSolucao.push(await enviarImagem(token, arquivo))
        }
        setEtapa(null)
      }
      // Precisa aguardar: onConfirm (finalizar, em TicketPanel) é assíncrono
      // e agora relança em caso de erro — sem esse await, o catch abaixo
      // nunca veria a falha, e o modal fecharia (ou pareceria travado) sem
      // explicar o que deu errado.
      await onConfirm({ texto: texto.trim(), solucaoConhecida, imagensUrlsSolucao })
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setEtapa(null)
    }
  }

  const textoBotao = etapa === 'enviando-imagem' ? 'Enviando imagens...' : carregandoExterno ? 'Finalizando...' : 'Confirmar e finalizar'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: CORES_APP.overlay, backdropFilter: 'blur(6px)' }} onClick={onCancel}>
      <div style={{ background: CORES_APP.card, border: '1px solid rgba(34,197,94,0.25)', borderRadius: 16, padding: '28px 26px', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}
        onClick={e => e.stopPropagation()} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✓</div>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: CORES_APP.tinta, margin: 0 }}>Registrar resolução</h3>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 12, margin: 0, marginTop: 2 }}>Documente como o problema foi resolvido antes de finalizar</p>
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
          <label style={estilos.label}>Prints da solução <span style={{ color: CORES_APP.textoSuave, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>opcional</span></label>
          <div onClick={() => !carregando && fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px dashed ${arquivos.length ? 'rgba(0,120,81,0.4)' : CORES_APP.borda}`, borderRadius: 10, padding: '22px 14px', textAlign: 'center', cursor: carregando ? 'default' : 'pointer', background: arquivos.length ? 'rgba(0,179,81,0.05)' : 'transparent', transition: 'all 0.2s' }}>
            <span style={{ color: arquivos.length ? '#00b351' : CORES_APP.textoFraco, display: 'flex', flexShrink: 0 }}>
              <IconPaperclip width={16} height={16} />
            </span>
            <span style={{ color: arquivos.length ? '#00b351' : CORES_APP.textoFraco, fontSize: 13 }}>
              {arquivos.length ? `${arquivos.length} ${arquivos.length > 1 ? 'imagens' : 'imagem'} selecionada${arquivos.length > 1 ? 's' : ''} — clique para adicionar mais` : 'Clique para anexar imagens'}
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
              // A partir de 5 imagens, trava a altura e passa a rolar em vez
              // de empurrar o resto do formulário pra baixo — mesmo ajuste
              // já aplicado em CreateTicket.jsx/ITAbrirChamado.jsx.
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

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'pointer', background: solucaoConhecida ? 'rgba(0,179,81,0.07)' : CORES_APP.fundoCampo, border: `1px solid ${solucaoConhecida ? 'rgba(0,120,81,0.25)' : CORES_APP.borda}`, borderRadius: 10, padding: '13px 14px' }}>
          <input type="checkbox" checked={solucaoConhecida} onChange={e => setSolucaoConhecida(e.target.checked)} disabled={carregando}
            style={{ accentColor: '#00b351', marginTop: 2, flexShrink: 0, width: 15, height: 15 }} />
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13, color: solucaoConhecida ? '#00b351' : CORES_APP.tinta, marginBottom: 2 }}>Marcar como solução conhecida</div>
            <div style={{ fontSize: 12, color: CORES_APP.textoFraco, lineHeight: 1.5 }}>Este tipo de problema pode se repetir. A solução ficará disponível na base de Soluções Conhecidas para referência futura.</div>
          </div>
        </label>

        {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={confirmar} disabled={!pronto || carregando}
            style={{ ...estilos.btnPrimary, background: pronto ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34,197,94,0.2)', color: pronto ? '#fff' : CORES_APP.textoSuave, cursor: pronto && !carregando ? 'pointer' : 'not-allowed', flex: 1, opacity: carregando ? 0.7 : 1 }}>
            {textoBotao}
          </button>
          <button onClick={onCancel} disabled={carregando}
            style={{ background: CORES_APP.fundoCampo, color: CORES_APP.textoFraco, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: '13px 18px', fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 500, cursor: carregando ? 'default' : 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResolutionModal
