import { IconMail } from '../icons'

// Campo de e-mail com ícone de envelope à esquerda, mesmo padrão visual do
// PasswordInput (ícone dentro do próprio campo, wrapper posicionado +
// input com padding extra pro lado do ícone) — usado nas 4 telas de
// autenticação (login colaborador, login TI, primeiro acesso). `iconColor`
// não tem default de propósito: cada tela passa a cor de acento que já usa
// pro olhinho do PasswordInput (cores.azulMedio em authTheme.js), pros dois
// ícones do mesmo formulário combinarem.
function EmailInput({ value, onChange, placeholder, disabled, style, iconColor }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', color: iconColor, pointerEvents: 'none',
      }}>
        <IconMail width={16} height={16} />
      </span>
      <input
        type="email"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...style, paddingLeft: 40 }}
      />
    </div>
  )
}

export default EmailInput
