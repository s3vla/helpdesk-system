import { useState } from 'react'
import BrandPanel from './auth/BrandPanel'
import FundoDecorativo from './auth/FundoDecorativo'
import EmailInput from './auth/EmailInput'
import PasswordInput from './PasswordInput'
import { estilosAuth, cores, fonteMono, botaoAzul } from '../styles/authTheme'
import { useAuth } from '../hooks/useAuth'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { traduzirErroApi } from '../utils/traduzirErroApi'

// Login da Área Técnica. Usa o MESMO endpoint POST /auth/login do
// colaborador (só existe um login na API) — a diferença é o perfilEsperado
// ('TECNICO') mandado junto, que o BACKEND valida contra o `tipo` real da
// conta antes de emitir qualquer token (ver AuthService.login). Rejeitar só
// no frontend não bastava: como o login() do AuthContext já guardava a
// sessão assim que a API respondia OK, uma conta de colaborador logando
// aqui ganhava um token válido de colaborador mesmo esta tela "recusando"
// depois — o App.jsx decide o painel só pelo `tipo`, então a pessoa caía no
// painel certo do jeito errado. Com a checagem no backend, essa sessão
// nunca chega a existir.
//
// Redesign visual sobre a mesma lógica — igual LoginScreen.jsx. Aqui a
// ação principal usa AZUL (não verde), conforme a regra de cor do design:
// azul é o tom de navegação/ação da área de TI.
function ITLoginScreen({ onLoginTecnico, onBack }) {
  const { login, mensagemSessao, limparMensagemSessao } = useAuth()
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
    limparMensagemSessao()
    setCarregando(true)
    try {
      // 'TECNICO' é o perfil que ESTA tela representa — o backend recusa
      // com 403 (mensagem própria, capturada no catch abaixo) se a conta
      // informada for de colaborador, antes de criar qualquer sessão.
      await login(email, pass, 'TECNICO')
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
      <main style={mobile ? estilosAuth.principalMobile : estilosAuth.principal}>
        <FundoDecorativo />
        <div style={mobile ? estilosAuth.cartaoMobile : estilosAuth.cartao}>
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

            {mensagemSessao && (
              <div style={{ background: cores.avisoBg, border: `1px solid ${cores.avisoBorda}`, borderRadius: 10, padding: '10px 14px', color: cores.avisoTexto, fontSize: 13 }}>
                {mensagemSessao}
              </div>
            )}

            <form style={estilosAuth.form} onSubmit={e => { e.preventDefault(); doLogin() }}>
              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>E-mail do técnico</span>
                <EmailInput value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tecnico@empresa-exemplo.com" style={estilosAuth.input} disabled={carregando} iconColor={cores.azulMedio} />
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
        </div>
      </main>
    </div>
  )
}

export default ITLoginScreen
