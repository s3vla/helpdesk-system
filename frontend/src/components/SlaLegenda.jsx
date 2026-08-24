import { useState } from 'react'
import { CORES_PRIORIDADE, CORES_APP } from '../styles/theme'
import { LIMITE_SLA_MINUTOS, LIMIAR_ATENCAO_SLA, formatarLimiteSla } from '../utils/slaConfig'
import { IconInfo } from './icons'

// Ordem de exibição fixa (alta primeiro, mais urgente) — LIMITE_SLA_MINUTOS
// é um objeto simples, então a ordem de `Object.entries` não é garantida
// pela leitura do código; melhor deixar explícita aqui.
const ORDEM_PRIORIDADE = ['alta', 'media', 'baixa']

// Popover discreto de consulta: "quais são os limites de SLA configurados
// hoje" — mesmo padrão de dropdown de CategoriaSelect.jsx (botão + painel
// posicionado + overlay fixo pra fechar ao clicar fora), só que sem
// selecionar nada (é só leitura). Os valores vêm inteiramente de
// slaConfig.js — nunca duplicados aqui, então ajustar o SLA em um único
// lugar já atualiza este texto sozinho.
function SlaLegenda() {
  const [aberto, setAberto] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" onClick={() => setAberto(v => !v)} title="Ver limites de prazo de resposta configurados"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: aberto ? CORES_APP.fundoCampo : 'transparent', color: CORES_APP.textoSuave, border: `1px solid ${aberto ? CORES_APP.borda : 'transparent'}`, borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}>
        <IconInfo width={13} height={13} />
      </button>

      {aberto && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 4 }} onClick={() => setAberto(false)} />
          {/* `right:0` (não `left:0`) — o botão fica perto da borda direita
              da barra de filtros; abrindo pra direita, o painel ultrapassa
              a viewport. Crescendo pra ESQUERDA a partir do botão, sempre
              cabe. */}
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 5, minWidth: 230, background: CORES_APP.popover, border: `1px solid ${CORES_APP.borda}`, borderRadius: 10, padding: 14, boxShadow: '0 8px 24px rgba(16,35,31,0.18)' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 12, color: CORES_APP.tinta, marginBottom: 10, letterSpacing: '0.02em' }}>
              Limites de prazo de resposta
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ORDEM_PRIORIDADE.map(prioridade => (
                <div key={prioridade} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: CORES_PRIORIDADE[prioridade].dot, flexShrink: 0 }} />
                  <span style={{ color: CORES_APP.texto, fontSize: 13, fontFamily: 'Outfit, sans-serif' }}>{CORES_PRIORIDADE[prioridade].label}</span>
                  <span style={{ color: CORES_APP.textoFraco, fontSize: 12, marginLeft: 'auto' }}>até {formatarLimiteSla(LIMITE_SLA_MINUTOS[prioridade])}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${CORES_APP.borda}`, marginTop: 11, paddingTop: 9, color: CORES_APP.textoSuave, fontSize: 11, lineHeight: 1.5 }}>
              Aviso de atenção a partir de {Math.round(LIMIAR_ATENCAO_SLA * 100)}% do tempo decorrido.
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SlaLegenda
