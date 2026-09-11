import { useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { criarSugestao } from '../services/forumService'
import { traduzirErroApi } from '../utils/traduzirErroApi'

// Modal de nova sugestão — mesmo padrão visual de overlay de
// PublicarAvisoModal.jsx, só que mais simples (sem tipo/fixado/expiraEm,
// nenhum modo de edição: Fórum não tem PATCH de conteúdo nesta primeira
// versão).
function NovaSugestaoModal({ onFechar, onCriou }) {
  const { token } = useAuth()
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const podeSalvar = titulo.trim() && mensagem.trim()

  function fechar() {
    if (!salvando) onFechar()
  }

  async function salvar() {
    if (!podeSalvar) return
    setErro('')
    setSalvando(true)
    try {
      const criada = await criarSugestao(token, { titulo: titulo.trim(), mensagem: mensagem.trim() })
      onCriou(criada)
    } catch (e) {
      setErro(traduzirErroApi(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: CORES_APP.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={fechar}>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.25)', padding: '22px 24px 24px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}
        className="animate-fade-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 19, color: CORES_APP.tinta, margin: 0 }}>
            Nova sugestão
          </h2>
          <button onClick={fechar} disabled={salvando} title="Fechar"
            style={{ background: CORES_APP.fundoCampo, border: 'none', cursor: salvando ? 'default' : 'pointer', color: CORES_APP.textoFraco, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={estilos.label}>Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Filtro por data no Mural de Avisos"
              style={estilos.input} disabled={salvando} />
          </div>
          <div>
            <label style={estilos.label}>Mensagem</label>
            <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Descreva sua ideia, opinião ou sugestão de ajuste"
              style={{ ...estilos.input, minHeight: 120, resize: 'vertical', lineHeight: 1.5 }} disabled={salvando} />
          </div>
          {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={salvar} disabled={!podeSalvar || salvando}
              style={{ ...estilos.btnPrimary, width: 'auto', flex: 1, opacity: salvando ? 0.7 : 1, cursor: !podeSalvar || salvando ? 'not-allowed' : 'pointer' }}>
              {salvando ? 'Publicando...' : 'Publicar sugestão'}
            </button>
            <button onClick={fechar} disabled={salvando}
              style={{ ...estilos.btnGhost, width: 'auto', flex: 1, textAlign: 'center', opacity: salvando ? 0.6 : 1, cursor: salvando ? 'default' : 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NovaSugestaoModal
