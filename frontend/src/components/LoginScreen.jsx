import { useState } from 'react'
import FirstAccessModal from './FirstAccessModal'
import BrandPanel from './auth/BrandPanel'
import FundoDecorativo from './auth/FundoDecorativo'
import EmailInput from './auth/EmailInput'
import PasswordInput from './PasswordInput'
import { IconChevronRight } from './icons'
import { estilosAuth, cores, botaoVerde } from '../styles/authTheme'
import { useAuth } from '../hooks/useAuth'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { emailComDominioAutorizado, MENSAGEM_DOMINIO_INVALIDO } from '../utils/dominiosEmailAutorizados'

// Tela de login do colaborador. Diferente da versão com dados mockados, não
// dá mais pra "adivinhar" se um e-mail já tem conta só de olhar uma lista
// local — o backend responde a mesma mensagem genérica pra e-mail
// inexistente e senha errada (de propósito, ver AuthService no backend).
// Por isso "Primeiro acesso" agora é um link explícito, não algo que abre
// sozinho quando o login falha.
//
// Redesign visual (layout split-screen claro) sobre a MESMA lógica de
// sempre — toda a validação/chamada de API abaixo é idêntica à versão
// anterior (tema escuro), só a apresentação mudou. Duas coisas do design
// de referência (Figma) que ficaram de fora de propósito, por não
// existirem no sistema: link "Esqueci minha senha" (não existe fluxo de
// reset por e-mail — só reset feito pelo técnico) e qualquer redirecionamento
// próprio: quem decide se cai em "trocar senha" continua sendo
// `usuario.deveTrocarSenha`, checado em App.jsx, nunca um campo
// inventado tipo "senhaPadrao" do código de referência.
function LoginScreen({ onLoginColaborador, onSwitchIT }) {
  const { login, mensagemSessao, limparMensagemSessao } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarPrimeiroAcesso, setMostrarPrimeiroAcesso] = useState(false)
  const largura = useWindowWidth()
  const mobile = largura < 900

  async function doLogin() {
    if (!emailComDominioAutorizado(email)) {
      setErr(MENSAGEM_DOMINIO_INVALIDO)
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
      // 'COLABORADOR' é o perfil que ESTA tela representa — o backend
      // recusa com 403 (mensagem própria, capturada no catch abaixo) se a
      // conta informada for de técnico, antes de criar qualquer sessão.
      await login(email, pass, 'COLABORADOR')
      onLoginColaborador()
    } catch (erro) {
      setErr(traduzirErroApi(erro))
    } finally {
      setCarregando(false)
    }
  }

  // Primeiro acesso agora é uma tela cheia própria (troca de "roupa" do
  // Figma: lá é uma rota separada, não um modal sobreposto) — mesmo
  // componente/mesma lógica de sempre, só muda COMO ele é montado aqui.
  if (mostrarPrimeiroAcesso) {
    return (
      <FirstAccessModal
        emailInicial={email}
        onSucesso={onLoginColaborador}
        onFechar={() => setMostrarPrimeiroAcesso(false)}
      />
    )
  }

  return (
    <div style={mobile ? estilosAuth.paginaMobile : estilosAuth.pagina} className="animate-fade-up">
      <BrandPanel />
      <main style={mobile ? estilosAuth.principalMobile : estilosAuth.principal}>
        <FundoDecorativo />
        <div style={mobile ? estilosAuth.cartaoMobile : estilosAuth.cartao}>
          <div style={estilosAuth.coluna}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={estilosAuth.eyebrow}>ACESSO COLABORADOR</span>
              <h2 style={estilosAuth.titulo}>Entrar no NovaDesk</h2>
              <p style={estilosAuth.texto}>{MENSAGEM_DOMINIO_INVALIDO}</p>
            </div>

            {mensagemSessao && (
              <div style={{ background: cores.avisoBg, border: `1px solid ${cores.avisoBorda}`, borderRadius: 10, padding: '10px 14px', color: cores.avisoTexto, fontSize: 13 }}>
                {mensagemSessao}
              </div>
            )}

            <form style={estilosAuth.form} onSubmit={e => { e.preventDefault(); doLogin() }}>
              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>E-mail corporativo</span>
                <EmailInput value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu e-mail corporativo" style={estilosAuth.input} disabled={carregando} iconColor={cores.azulMedio} />
              </label>

              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Senha</span>
                <PasswordInput value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="Sua senha" disabled={carregando}
                  style={{ ...estilosAuth.input, ...estilosAuth.inputSenha }} iconColor={cores.azulMedio} />
              </label>

              {err && <p style={{ color: cores.erro, fontSize: 13, margin: 0 }}>{err}</p>}

              <button type="submit" disabled={carregando} style={{ ...botaoVerde, opacity: carregando ? 0.7 : 1, cursor: carregando ? 'default' : 'pointer' }}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div style={{ ...estilosAuth.divisor, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, color: cores.textoFraco }}>
                Primeiro acesso?{' '}
                <button type="button" onClick={() => setMostrarPrimeiroAcesso(true)} style={estilosAuth.link}>
                  Cadastre-se com seu e-mail corporativo
                </button>
              </span>
              <button type="button" onClick={onSwitchIT} style={{ ...estilosAuth.link, color: cores.textoFraco, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Sou da equipe técnica — acessar painel de TI</span>
                <IconChevronRight width={14} height={14} style={{ flexShrink: 0 }} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginScreen
