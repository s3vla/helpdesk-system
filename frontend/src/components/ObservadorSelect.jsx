import { useState } from 'react'
import { IconSearch } from './icons'
import { CORES_APP } from '../styles/theme'

// Dropdown com busca pra adicionar um colaborador como observador ("Cc")
// de um chamado — mesmo padrão de popover do CategoriaSelect/menu de
// nível, mas com campo de busca porque a lista de colaboradores pode ter
// bastante gente (diferente de categoria, que são só 5 opções fixas).
// `opcoes` já vem filtrada pelo chamador (sem o solicitante, sem quem já
// é observador) — este componente só cuida de abrir/fechar e filtrar por
// texto digitado.
function ObservadorSelect({ opcoes, onAdicionar, disabled }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

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
        style={{ background: 'rgba(0,179,81,0.1)', color: '#00b351', border: '1px solid rgba(0,120,81,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: disabled ? 'default' : 'pointer' }}>
        + Adicionar
      </button>

      {aberto && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 8 }} onClick={fechar} />
          {/* `right: 0` (não `left: 0`) porque este botão fica encostado na
              borda direita da linha "Cc" (justifyContent: space-between) —
              abrindo pra direita do próprio botão, o popover vazava pra fora
              do painel em vez de crescer pro lado que ainda tem espaço.
              `width` com min() trava numa largura confortável no desktop mas
              encolhe pra caber no painel em telas estreitas (o painel some
              com 20px de padding de cada lado no mobile — os 48px de folga
              cobrem isso com uma margem extra). */}
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: 8, width: 'min(260px, calc(100vw - 48px))', boxSizing: 'border-box', boxShadow: '0 8px 24px rgba(16,35,31,0.18)' }}>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: CORES_APP.textoSuave, display: 'flex', pointerEvents: 'none' }}><IconSearch width={13} height={13} /></span>
              <input value={busca} onChange={e => setBusca(e.target.value)} autoFocus
                placeholder="Buscar colaborador..."
                style={{ width: '100%', boxSizing: 'border-box', background: CORES_APP.fundoCampo, border: `1px solid ${CORES_APP.borda}`, borderRadius: 6, padding: '7px 9px 7px 28px', fontSize: 12, color: CORES_APP.tinta, fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtradas.length === 0 && (
                <div style={{ color: CORES_APP.textoSuave, fontSize: 12, padding: '10px 8px', textAlign: 'center' }}>Nenhum colaborador encontrado</div>
              )}
              {filtradas.map(u => (
                <button key={u.id} type="button" onClick={() => { onAdicionar(u.id); fechar() }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: 6, padding: '8px 9px', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = CORES_APP.fundoCampo }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ color: CORES_APP.tinta, fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>{u.name ?? '— (aguardando cadastro)'}</div>
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

export default ObservadorSelect
