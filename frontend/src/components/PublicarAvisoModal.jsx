import { useState } from 'react'
import { estilos, CORES_APP, CORES_TIPO_AVISO } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { criarAviso, atualizarAviso } from '../services/avisosService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { paraDatetimeLocal } from '../utils/formatters'

const TIPOS = ['INFORMATIVO', 'ALERTA', 'MANUTENCAO']

// Modal de publicar/editar aviso — mesmo padrão visual de overlay de
// TrocarSenhaModal.jsx (modo voluntário), com cabeçalho + "×" de fechar no
// mesmo estilo do painel de detalhe de chamado (TicketPanel.jsx).
// `avisoEmEdicao` presente = modo edição (PATCH), ausente = modo criação
// (POST).
function PublicarAvisoModal({ avisoEmEdicao, onFechar, onSalvou }) {
  const { token } = useAuth()
  const [titulo, setTitulo] = useState(avisoEmEdicao?.titulo ?? '')
  const [mensagem, setMensagem] = useState(avisoEmEdicao?.mensagem ?? '')
  const [tipo, setTipo] = useState(avisoEmEdicao?.tipo ?? 'INFORMATIVO')
  const [fixado, setFixado] = useState(avisoEmEdicao?.fixado ?? false)
  // paraDatetimeLocal usa os getters LOCAIS do Date — pré-preenche o campo
  // com o horário de parede correto, sem o desvio de fuso que
  // toISOString().slice(...) causaria (ver comentário na própria função).
  const [expiraEm, setExpiraEm] = useState(avisoEmEdicao?.expiraEm ? paraDatetimeLocal(avisoEmEdicao.expiraEm) : '')
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
      const dados = { titulo: titulo.trim(), mensagem: mensagem.trim(), tipo, fixado, expiraEm: expiraEm || null }
      if (avisoEmEdicao) {
        await atualizarAviso(token, avisoEmEdicao.id, dados)
      } else {
        await criarAviso(token, dados)
      }
      onSalvou()
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
            {avisoEmEdicao ? 'Editar aviso' : 'Publicar aviso'}
          </h2>
          <button onClick={fechar} disabled={salvando} title="Fechar"
            style={{ background: CORES_APP.fundoCampo, border: 'none', cursor: salvando ? 'default' : 'pointer', color: CORES_APP.textoFraco, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={estilos.label}>Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Manutenção programada"
              style={estilos.input} disabled={salvando} />
          </div>
          <div>
            <label style={estilos.label}>Mensagem</label>
            <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Ex: Sistema ficará indisponível das 22h às 23h para manutenção preventiva"
              style={{ ...estilos.input, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }} disabled={salvando} />
          </div>
          <div>
            <label style={estilos.label}>Tipo</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TIPOS.map(valor => {
                const cor = CORES_TIPO_AVISO[valor]
                const selecionado = tipo === valor
                return (
                  <button key={valor} type="button" onClick={() => setTipo(valor)} disabled={salvando}
                    style={{
                      background: selecionado ? cor.bg : CORES_APP.fundoCampo,
                      color: selecionado ? cor.fg : CORES_APP.textoFraco,
                      border: `1px solid ${selecionado ? cor.borda : CORES_APP.borda}`,
                      borderRadius: 7, padding: '9px 10px', fontSize: 13, fontFamily: 'Outfit, sans-serif',
                      fontWeight: selecionado ? 700 : 400, cursor: 'pointer', flex: 1, transition: 'all 0.15s',
                    }}>
                    {cor.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={estilos.label}>Expira em</label>
            <input type="datetime-local" value={expiraEm} onChange={e => setExpiraEm(e.target.value)}
              style={estilos.input} disabled={salvando} />
            <p style={{ color: CORES_APP.textoSuave, fontSize: 12, margin: '4px 0 0' }}>Depois desse horário, o aviso some da lista ativa (continua no histórico).</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, color: CORES_APP.texto }}>
            <input type="checkbox" checked={fixado} onChange={e => setFixado(e.target.checked)} disabled={salvando} />
            Fixar no topo do mural
          </label>
          {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={salvar} disabled={!podeSalvar || salvando}
              style={{ ...estilos.btnPrimary, width: 'auto', flex: 1, opacity: salvando ? 0.7 : 1, cursor: !podeSalvar || salvando ? 'not-allowed' : 'pointer' }}>
              {salvando ? 'Salvando...' : avisoEmEdicao ? 'Salvar alterações' : 'Publicar'}
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

export default PublicarAvisoModal
