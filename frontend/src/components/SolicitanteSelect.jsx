import { useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { IconChevronDown, IconSearch } from './icons'

// Dropdown com busca pro campo "Solicitante" do formulário "Abrir chamado"
// (Área Técnica) — em nome de quem o técnico está abrindo o chamado.
// Mesmo padrão visual do CategoriaSelect (trigger de largura cheia
// mostrando o valor escolhido) com a busca do ObservadorSelect (lista pode
// ter bastante colaborador). `opcoes` já vem só com colaboradores ativos
// (filtrados por quem chama, ver ITAbrirChamado) — este componente só
// cuida de abrir/fechar/filtrar por texto digitado.
function SolicitanteSelect({ opcoes, valor, onChange, disabled }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  const selecionado = opcoes.find(u => u.id === valor)

  const filtradas = opcoes.filter(u => {
    if (!busca.trim()) return true
    const termo = busca.toLowerCase()
    return (u.name ?? '').toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
  })

  function fechar() {
    setAberto(false)
    setBusca('')
  }

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setAberto(v => !v)} disabled={disabled}
        style={{
          width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          background: CORES_APP.fundoCampo, color: selecionado ? CORES_APP.tinta : CORES_APP.placeholder,
          border: `1px solid ${aberto ? 'rgba(0,120,81,0.4)' : 'rgba(0,120,81,0.2)'}`,
          borderRadius: 10, padding: '13px 14px', fontSize: 15, fontFamily: 'Inter, sans-serif', textAlign: 'left',
          cursor: disabled ? 'default' : 'pointer', transition: 'all 0.15s',
        }}>
        {selecionado ? `${selecionado.name ?? '— (aguardando cadastro)'} · ${selecionado.email}` : 'Selecione o colaborador...'}
        <IconChevronDown width={15} height={15} style={{ color: CORES_APP.textoFraco, transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>

      {aberto && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 4 }} onClick={fechar} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 5, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: 8, boxShadow: '0 8px 24px rgba(16,35,31,0.18)' }}>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, display: 'flex', pointerEvents: 'none' }}><IconSearch width={13} height={13} /></span>
              <input value={busca} onChange={e => setBusca(e.target.value)} autoFocus
                placeholder="Buscar colaborador..."
                style={{ ...estilos.input, padding: '8px 10px 8px 28px', fontSize: 13 }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtradas.length === 0 && (
                <div style={{ color: CORES_APP.textoSuave, fontSize: 12, padding: '10px 8px', textAlign: 'center' }}>Nenhum colaborador encontrado</div>
              )}
              {filtradas.map(u => (
                <button key={u.id} type="button" onClick={() => { onChange(u.id); fechar() }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: u.id === valor ? 'rgba(0,179,81,0.1)' : 'transparent', border: 'none', borderRadius: 6, padding: '8px 9px', cursor: 'pointer' }}
                  onMouseEnter={e => { if (u.id !== valor) e.currentTarget.style.background = CORES_APP.fundoCampo }}
                  onMouseLeave={e => { if (u.id !== valor) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ color: u.id === valor ? '#00b351' : CORES_APP.tinta, fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>{u.name ?? '— (aguardando cadastro)'}</div>
                  <div style={{ color: CORES_APP.textoFraco, fontSize: 11 }}>{u.email}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SolicitanteSelect
