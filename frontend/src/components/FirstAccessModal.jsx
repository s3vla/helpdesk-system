import { useEffect, useRef, useState } from 'react'
import BrandPanel from './auth/BrandPanel'
import FundoDecorativo from './auth/FundoDecorativo'
import EmailInput from './auth/EmailInput'
import PasswordInput from './PasswordInput'
import PasswordStrengthBar, { ConfirmacaoSenha } from './auth/PasswordStrengthBar'
import { estilosAuth, cores, botaoVerde, botaoInativo, forcaSenha } from '../styles/authTheme'
import { sugerirSetorPorEmail } from '../services/setoresService'
import { useAuth } from '../hooks/useAuth'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { emailComDominioAutorizado, MENSAGEM_DOMINIO_INVALIDO } from '../utils/dominiosEmailAutorizados'

// Tela de "Primeiro Acesso": cadastra um colaborador novo direto pela API
// (POST /auth/primeiro-acesso) e já entra logado com o token recebido de
// volta — por isso chama useAuth().primeiroAcesso aqui dentro, em vez de só
// coletar dados e devolver pro componente pai.
//
// O e-mail continua sendo um campo EDITÁVEL (não travado, sem selo de
// "verificado") — diferente do design de referência (Figma), que assumia
// um e-mail pré-verificado por convite. Aqui o backend nunca revela se um
// e-mail já existe ou não (resposta genérica em caso de erro de login, por
// segurança), então não dá pra "detectar"/travar isso automaticamente —
// mostrar um selo de verificado seria enganoso. Departamento é SEMPRE
// somente-leitura agora — é só um preview em tempo real do que o SERVIDOR
// vai derivar do prefixo do e-mail (GET /setores/sugerir), nunca mais um
// valor que este formulário envie; quando o prefixo não tem mapeamento
// cadastrado, mostra "Não identificado automaticamente" (a conta é criada
// sem setor mesmo assim, ver SetoresService.buscarSetorPorEmail).
//
// Antes era um modal sobreposto (overlay); agora é uma tela cheia própria
// (troca de "roupa" pro layout split-screen), mas continua sendo montada
// do mesmo jeito por quem chama (LoginScreen troca pra ela em vez de
// abrir por cima) — mesmas props, mesma lógica.
function FirstAccessModal({ emailInicial, onSucesso, onFechar }) {
  const { primeiroAcesso } = useAuth()
  const [email, setEmail] = useState(emailInicial ?? '')
  const [name, setName] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const largura = useWindowWidth()
  const mobile = largura < 900

  // Preview do setor sugerido pra este e-mail — só exibição, nunca enviado
  // ao backend: o servidor deriva o setor de novo por conta própria a
  // partir do e-mail (ver AuthService.primeiroAcesso), então mandar esse
  // valor daqui seria redundante e, pior, sugeriria que o cliente ainda
  // manda no que o campo Departamento acaba virando.
  const [setorSugerido, setSetorSugerido] = useState(null)
  const [consultandoSetor, setConsultandoSetor] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    const emailAparado = email.trim()
    if (!emailAparado.includes('@')) {
      setSetorSugerido(null)
      setConsultandoSetor(false)
      return
    }
    setConsultandoSetor(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const resposta = await sugerirSetorPorEmail(emailAparado)
        setSetorSugerido(resposta.setor)
      } catch {
        setSetorSugerido(null)
      } finally {
        setConsultandoSetor(false)
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [email])

  const podeContinuar = email.trim() && name.trim() && senha && confirmarSenha
  const forca = forcaSenha(senha)

  async function enviar() {
    if (!podeContinuar) return
    if (!emailComDominioAutorizado(email)) {
      setErro(MENSAGEM_DOMINIO_INVALIDO)
      return
    }
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres')
      return
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      return
    }
    setErro('')
    setCarregando(true)
    try {
      await primeiroAcesso({ email: email.trim(), senha, nome: name.trim() })
      onSucesso()
    } catch (e) {
      setErro(traduzirErroApi(e))
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
              <span style={estilosAuth.eyebrow}>PRIMEIRO ACESSO</span>
              <h2 style={estilosAuth.titulo}>Complete seu cadastro</h2>
              <p style={estilosAuth.texto}>Esses dados aparecem nos chamados que você abrir, para o time de TI saber quem procurar.</p>
            </div>

            <form style={estilosAuth.form} onSubmit={e => { e.preventDefault(); enviar() }}>
              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>E-mail corporativo</span>
                <EmailInput value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu e-mail corporativo" style={estilosAuth.input} disabled={carregando} iconColor={cores.azulMedio} />
              </label>

              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Nome completo</span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" style={estilosAuth.input} disabled={carregando} />
              </label>

              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Departamento</span>
                <input
                  value={consultandoSetor ? 'Identificando...' : (setorSugerido?.nome ?? 'Não identificado automaticamente')}
                  readOnly
                  disabled
                  style={{ ...estilosAuth.input, background: cores.fundoCampo, color: cores.texto, cursor: 'default' }}
                />
              </label>

              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Senha</span>
                <PasswordInput value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" disabled={carregando}
                  style={{ ...estilosAuth.input, ...estilosAuth.inputSenha }} iconColor={cores.azulMedio} />
                <PasswordStrengthBar forca={forca} />
              </label>

              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Confirmar senha</span>
                <PasswordInput value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="Digite a senha novamente" disabled={carregando}
                  style={{ ...estilosAuth.input, ...estilosAuth.inputSenha }} iconColor={cores.azulMedio} />
                <ConfirmacaoSenha confirmar={confirmarSenha} nova={senha} />
              </label>

              {erro && <p style={{ color: cores.erro, fontSize: 13, margin: 0 }}>{erro}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <button type="submit" disabled={!podeContinuar || carregando}
                  style={{ ...(podeContinuar && !carregando ? botaoVerde : botaoInativo), flex: 1, marginTop: 0 }}>
                  {carregando ? 'Criando conta...' : 'Criar conta'}
                </button>
                <button type="button" onClick={onFechar} disabled={carregando} style={{
                  height: 52, padding: '0 20px', fontFamily: estilosAuth.pagina.fontFamily, fontSize: 15, fontWeight: 500,
                  color: cores.textoFraco, background: 'transparent', border: `1px solid ${cores.borda}`, borderRadius: 10,
                  cursor: carregando ? 'default' : 'pointer',
                }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default FirstAccessModal
