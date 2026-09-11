import { useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { criarAnotacao, atualizarAnotacao } from '../services/anotacoesService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { useEnterParaEnviar } from '../hooks/useEnterParaEnviar'

// Modal de criar/editar anotação — mesmo padrão de TarefaModal.jsx, só que
// com um único campo (`conteudo`, sem título separado). `anotacaoEmEdicao`
// presente = modo edição (PATCH), ausente = criação (POST).
function AnotacaoModal({ anotacaoEmEdicao, onFechar, onSalvou }) {
  const { token } = useAuth()
  const [conteudo, setConteudo] = useState(anotacaoEmEdicao?.conteudo ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const podeSalvar = conteudo.trim()
  const aoTeclarEnter = useEnterParaEnviar(salvar)

  function fechar() {
    if (!salvando) onFechar()
  }

  async function salvar() {
    if (!podeSalvar) return
    setErro('')
    setSalvando(true)
    try {
      if (anotacaoEmEdicao) {
        await atualizarAnotacao(token, anotacaoEmEdicao.id, conteudo.trim())
      } else {
        await criarAnotacao(token, conteudo.trim())
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
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.25)', padding: '22px 24px 24px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}
        className="animate-fade-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${CORES_APP.bordaSuave}` }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 19, color: CORES_APP.tinta, margin: 0 }}>
            {anotacaoEmEdicao ? 'Editar anotação' : 'Nova anotação'}
          </h2>
          <button onClick={fechar} disabled={salvando} title="Fechar"
            style={{ background: CORES_APP.fundoCampo, border: 'none', cursor: salvando ? 'default' : 'pointer', color: CORES_APP.textoFraco, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} onKeyDown={aoTeclarEnter} placeholder="Escreva sua anotação..." autoFocus
            style={{ ...estilos.input, minHeight: 160, resize: 'vertical', lineHeight: 1.5 }} disabled={salvando} />
          {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={salvar} disabled={!podeSalvar || salvando}
              style={{ ...estilos.btnPrimary, width: 'auto', flex: 1, opacity: salvando ? 0.7 : 1, cursor: !podeSalvar || salvando ? 'not-allowed' : 'pointer' }}>
              {salvando ? 'Salvando...' : anotacaoEmEdicao ? 'Salvar alterações' : 'Criar anotação'}
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

export default AnotacaoModal
