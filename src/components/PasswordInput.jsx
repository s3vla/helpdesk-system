import { useState } from 'react'
import { estilos } from '../styles/theme'
import { IconEye, IconEyeOff } from './icons'

// Campo de senha com o "olhinho" de mostrar/ocultar — reaproveitado em toda
// tela que pede senha (login de colaborador, login de técnico, primeiro
// acesso, trocar senha). Sempre começa oculto (type="password"); o valor
// digitado nunca se perde ao alternar porque `value`/`onChange` continuam
// controlados por quem usa este componente — só o atributo `type` do input
// muda aqui dentro, o estado do texto em si mora no componente pai, como
// sempre morou.
function PasswordInput({ value, onChange, placeholder, disabled, onKeyDown, style }) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visivel ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...(style ?? estilos.input), paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={() => setVisivel(v => !v)}
        disabled={disabled}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        style={{
          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', color: '#7b92b4', cursor: disabled ? 'default' : 'pointer',
          padding: 0,
        }}
      >
        {visivel ? <IconEyeOff width={17} height={17} /> : <IconEye width={17} height={17} />}
      </button>
    </div>
  )
}

export default PasswordInput
