import { useState } from 'react'
import BrandPanel from './auth/BrandPanel'
import PasswordInput from './PasswordInput'
import { estilosAuth, cores, fonteMono, botaoAzul } from '../styles/authTheme'
import { useAuth } from '../hooks/useAuth'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { traduzirErroApi } from '../utils/traduzirErroApi'

// Login da Área Técnica. Usa o MESMO endpoint POST /auth/login do
// colaborador (só existe um login na API) — a diferença é só que esta tela
// rejeita o acesso se o `tipo` devolvido não for TECNICO, mantendo a
// separação "área restrita" mesmo com credenciais válidas de outro tipo.
//
// Redesign visual sobre a mesma lógica — igual LoginScreen.jsx. Aqui a
// ação principal usa AZUL (não verde), conforme a regra de cor do design:
// azul é o tom de navegação/ação da área de TI.
function ITLoginScreen({ onLoginTecnico, onBack }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [carregando, setCarregando] = useState(false)
  const largura = useWindowWidth()
  const mobile = largura < 900

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
    <div style={mobile ? estilosAuth.paginaMobile : estilosAuth.pagina} className="animate-fade-up">
      <BrandPanel />
      <main style={estilosAuth.principal}>
        <div style={estilosAuth.coluna}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8,
              padding: '6px 12px', fontFamily: fonteMono, fontSize: 11, letterSpacing: '0.16em',
              color: cores.azul, background: '#E8EEFB', borderRadius: 999,
            }}>
              ÁREA TÉCNICA · ACESSO RESTRITO
            </span>
            <h2 style={{ ...estilosAuth.titulo, marginTop: 8 }}>Painel de TI</h2>
            <p style={estilosAuth.texto}>Credenciais de técnico. Os acessos são registrados em log.</p>
          </div>

          <form style={estilosAuth.form} onSubmit={e => { e.preventDefault(); doLogin() }}>
            <label style={estilosAuth.campo}>
              <span style={estilosAuth.rotulo}>E-mail do técnico</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tecnico@novatechagro.com.br" style={estilosAuth.input} disabled={carregando} />
            </label>

            <label style={estilosAuth.campo}>
              <span style={estilosAuth.rotulo}>Senha</span>
              <PasswordInput value={pass} onChange={e => setPass(e.target.value)}
                placeholder="Sua senha" disabled={carregando}
                style={{ ...estilosAuth.input, ...estilosAuth.inputSenha }} iconColor={cores.azulMedio} />
            </label>

            {err && <p style={{ color: cores.erro, fontSize: 13, margin: 0 }}>{err}</p>}

            <button type="submit" disabled={carregando} style={{ ...botaoAzul, opacity: carregando ? 0.7 : 1, cursor: carregando ? 'default' : 'pointer' }}>
              {carregando ? 'Entrando...' : 'Acessar painel de TI'}
            </button>
          </form>

          <div style={estilosAuth.divisor}>
            <button type="button" onClick={onBack} style={{ ...estilosAuth.link, color: cores.textoFraco }}>
              ← Voltar ao acesso de colaboradores
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ITLoginScreen
