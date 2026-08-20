import { useState } from 'react'
import Logo from './Logo'
import FirstAccessModal from './FirstAccessModal'
import { estilos, IMAGEM_FUNDO_LOGIN } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import PasswordInput from './PasswordInput'

// Tela de login do colaborador. Diferente da versão com dados mockados, não
// dá mais pra "adivinhar" se um e-mail já tem conta só de olhar uma lista
// local — o backend responde a mesma mensagem genérica pra e-mail
// inexistente e senha errada (de propósito, ver AuthService no backend).
// Por isso "Primeiro acesso" agora é um link explícito, não algo que abre
// sozinho quando o login falha.
function LoginScreen({ onLoginColaborador, onSwitchIT }) {
  const { login, mensagemSessao, limparMensagemSessao } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarPrimeiroAcesso, setMostrarPrimeiroAcesso] = useState(false)

  async function doLogin() {
    if (!email.toLowerCase().endsWith('@novatechagro.com.br')) {
      setErr('Use seu e-mail corporativo @novatechagro.com.br')
      return
    }
    if (!pass) {
      setErr('Informe sua senha')
      return
    }
    setErr('')
    limparMensagemSessao()
    setCarregando(true)
    try {
      const usuarioLogado = await login(email, pass)
      if (usuarioLogado.tipo !== 'COLABORADOR') {
        setErr('Essas credenciais são de um técnico — use a Área Técnica para entrar.')
        return
      }
      onLoginColaborador()
    } catch (erro) {
      setErr(traduzirErroApi(erro))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#060f1e' }}>
      <img src={IMAGEM_FUNDO_LOGIN} alt="Lavoura Novatech" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 620px 680px at 50% 50%, rgba(8,20,45,0.72) 0%, rgba(8,20,45,0.5) 40%, rgba(8,20,45,0.28) 70%, rgba(8,20,45,0.15) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }} className="animate-fade-up">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <Logo size={54} />
        </div>
        <div style={{ background: 'rgba(10,22,42,0.94)', border: '1px solid rgba(0,120,81,0.2)', borderRadius: 18, padding: '34px 30px', backdropFilter: 'blur(24px)' }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#f0f4ff', margin: '0 0 6px' }}>Bem-vindo</h1>
          <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 26px' }}>Acesse com seu e-mail corporativo</p>

          {mensagemSessao && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#fbbf24', fontSize: 13 }}>
              {mensagemSessao}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={estilos.label}>E-mail corporativo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="seu.nome@novatechagro.com.br" style={estilos.input} disabled={carregando} />
            </div>
            <div>
              <label style={estilos.label}>Senha</label>
              <PasswordInput value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()}
                placeholder="••••••••" disabled={carregando} />
            </div>
            {err && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{err}</p>}
            <button onClick={doLogin} disabled={carregando} style={{ ...estilos.btnPrimary, marginTop: 6, opacity: carregando ? 0.6 : 1, cursor: carregando ? 'default' : 'pointer' }}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <button onClick={() => setMostrarPrimeiroAcesso(true)} style={{ background: 'none', border: 'none', color: '#00b351', cursor: 'pointer', fontSize: 13 }}>
              Primeiro acesso? Cadastre-se aqui
            </button>
          </div>

          <div style={{ marginTop: 18, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <button onClick={onSwitchIT} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', textDecorationColor: 'rgba(123,146,180,0.35)' }}>
              Área Técnica — TI →
            </button>
          </div>
        </div>
      </div>

      {mostrarPrimeiroAcesso && (
        <FirstAccessModal
          emailInicial={email}
          onSucesso={onLoginColaborador}
          onFechar={() => setMostrarPrimeiroAcesso(false)}
        />
      )}
    </div>
  )
}

export default LoginScreen
