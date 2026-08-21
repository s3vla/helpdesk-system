import { cores, fonte, fonteMono } from '../../styles/authTheme'

// Barra de força de senha — feedback visual client-side, NÃO é validação:
// a regra real (mínimo 8 caracteres) continua só no backend
// (TrocarSenhaDto/PrimeiroAcessoDto). Funcionalidade nova, não existia
// antes desse redesign.
function PasswordStrengthBar({ forca }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
      <div style={{ flex: 1, height: 4, background: cores.bordaSuave, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, transition: 'width .2s, background .2s', width: forca.pct, background: forca.cor }} />
      </div>
      <span style={{ fontFamily: fonteMono, fontSize: 11, letterSpacing: '0.08em', color: cores.textoFraco }}>{forca.label}</span>
    </div>
  )
}

// Indicador "as senhas conferem/não conferem" — só aparece depois que a
// pessoa começou a digitar a confirmação, pra não mostrar erro antes da
// hora.
export function ConfirmacaoSenha({ confirmar, nova }) {
  if (!confirmar) return null
  const ok = confirmar === nova
  return (
    <span style={{ fontSize: 12, color: ok ? cores.verdeEscuro : cores.erro, fontFamily: fonte }}>
      {ok ? 'As senhas conferem.' : 'As senhas não conferem.'}
    </span>
  )
}

export default PasswordStrengthBar
