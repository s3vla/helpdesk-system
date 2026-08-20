import { useState } from 'react'
import { CATEGORIAS, LABEL_CATEGORIA } from '../utils/categorias'
import { IconChevronDown } from './icons'

// Dropdown customizado pra categoria do chamado: fechado, mostra só a opção
// escolhida; clicar expande a lista de opções. Existe pra reduzir a
// quantidade de controles visíveis de uma vez no formulário de abertura —
// os 5 botões lado a lado antes ocupavam espaço permanentemente, mesmo
// depois de uma categoria já escolhida. Prioridade continua com botões
// lado a lado (só 3 opções, cabe sem poluir a tela).
function CategoriaSelect({ valor, onChange, disabled }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setAberto(v => !v)} disabled={disabled}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          background: 'rgba(255,255,255,0.04)', color: '#00b351',
          border: `1px solid ${aberto ? 'rgba(0,120,81,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8, padding: '10px 13px', fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
          cursor: disabled ? 'default' : 'pointer', transition: 'all 0.15s',
        }}>
        {LABEL_CATEGORIA[valor]}
        <IconChevronDown width={15} height={15} style={{ color: '#7b92b4', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>

      {aberto && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 4 }} onClick={() => setAberto(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 5, background: '#0d1b34', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {CATEGORIAS.map(c => (
              <button key={c} type="button" onClick={() => { onChange(c); setAberto(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: c === valor ? 'rgba(0,179,81,0.1)' : 'transparent',
                  color: c === valor ? '#00b351' : '#cbd5e1',
                  border: 'none', borderRadius: 6, padding: '9px 11px', fontSize: 13, fontFamily: 'Outfit, sans-serif',
                  fontWeight: c === valor ? 600 : 400, cursor: 'pointer',
                }}>
                {LABEL_CATEGORIA[c]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CategoriaSelect
