import { useState } from 'react'
import Logo from './Logo'
import { estilos, IMAGEM_FUNDO_LOGIN } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import PasswordInput from './PasswordInput'

// Login da Área Técnica. Usa o MESMO endpoint POST /auth/login do
// colaborador (só existe um login na API) — a diferença é só que esta tela
// rejeita o acesso se o `tipo` devolvido não for TECNICO, mantendo a
// separação "área restrita" mesmo com credenciais válidas de outro tipo.
function ITLoginScreen({ onLoginTecnico, onBack }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function doLogin() {
    if (!email || !pass) {
      setErr('Preencha e-mail e senha')
      return
    }
    setErr('')
    setCarregando(true)
    try {
      const usuarioLogado = await login(email, pass)
      if (usuarioLogado.tipo !== 'TECNICO') {
        setErr('Essas credenciais não são de um técnico de TI.')
        return
      }
      onLoginTecnico()
    } catch (erro) {
      setErr(traduzirErroApi(erro))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#04080f' }}>
      <img src={IMAGEM_FUNDO_LOGIN} alt="Lavoura" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 620px 680px at 50% 50%, rgba(4,8,18,0.85) 0%, rgba(4,8,18,0.6) 40%, rgba(4,8,18,0.35) 70%, rgba(4,8,18,0.18) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }} className="animate-fade-up">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ background: 'rgba(0,179,81,0.1)', border: '1px solid rgba(0,120,81,0.32)', borderRadius: 99, padding: '6px 18px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00b351', display: 'inline-block' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: '#00b351', textTransform: 'uppercase' }}>Área Técnica — Restrito</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo size={46} />
        </div>
        <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(0,120,81,0.22)', borderRadius: 18, padding: '34px 30px', backdropFilter: 'blur(24px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00b351" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: '#f0f4ff', margin: 0 }}>Acesso Restrito</h1>
          </div>
          <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 26px' }}>Use suas credenciais de técnico TI</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={estilos.label}>E-mail TI</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="tecnico@novatechagro.com.br" style={estilos.input} disabled={carregando} />
            </div>
            <div>
              <label style={estilos.label}>Senha</label>
              <PasswordInput value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="••••••••" disabled={carregando} />
            </div>
            {err && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{err}</p>}
            <button onClick={doLogin} disabled={carregando} style={{ ...estilos.btnPrimary, marginTop: 6, opacity: carregando ? 0.6 : 1, cursor: carregando ? 'default' : 'pointer' }}>
              {carregando ? 'Entrando...' : 'Acessar Painel TI'}
            </button>
          </div>
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 13 }}>← Acesso de colaboradores</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ITLoginScreen
