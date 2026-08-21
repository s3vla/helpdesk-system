import { useState } from 'react'
import { estilos, CORES_APP } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import PasswordInput from './PasswordInput'
import BrandPanel from './auth/BrandPanel'
import PasswordStrengthBar, { ConfirmacaoSenha } from './auth/PasswordStrengthBar'
import { estilosAuth, cores, botaoVerde, botaoInativo, forcaSenha } from '../styles/authTheme'

// "Trocar minha senha" funciona em dois modos, com LAYOUT diferente de
// propósito (mesma paleta clara nos dois agora que o sistema inteiro
// migrou pro tema claro — só a estrutura visual muda, não mais a cor):
// - `obrigatorio`: técnico de seed que ainda não trocou a senha de
//   bootstrap do .env (ver App.jsx, decide isso a partir de
//   `usuario.deveTrocarSenha`) — acontece ANTES de qualquer painel
//   aparecer, então usa o layout split-screen de tela cheia, igual às
//   outras telas de autenticação (estilosAuth/cores, de authTheme.js).
// - normal: acionado pela pessoa por vontade própria (link no menu do
//   usuário) DENTRO do painel já logado — continua um modal sobreposto
//   compacto (não vira tela cheia no meio do painel, que seria um
//   contraste de LAYOUT estranho só pra trocar a senha), mas usa
//   CORES_APP (o mesmo tema claro do resto do app) em vez de authTheme.js.
// A senha ATUAL é sempre exigida nos dois modos — é o que garante que quem
// está trocando é o dono de verdade da conta, não alguém que só pegou uma
// sessão aberta.
function TrocarSenhaModal({ obrigatorio, onFechar, onSucesso }) {
  const { trocarSenha } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const largura = useWindowWidth()
  const mobile = largura < 900

  const podeEnviar = senhaAtual && novaSenha && confirmarNovaSenha
  const forca = forcaSenha(novaSenha)

  async function enviar() {
    if (!podeEnviar) return
    if (novaSenha.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres')
      return
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErro('A nova senha e a confirmação não coincidem')
      return
    }
    setErro('')
    setCarregando(true)
    try {
      await trocarSenha({ senhaAtual, novaSenha, confirmarNovaSenha })
      onSucesso?.()
    } catch (e) {
      setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  if (obrigatorio) {
    return (
      <div style={mobile ? estilosAuth.paginaMobile : estilosAuth.pagina} className="animate-fade-up">
        <BrandPanel />
        <main style={estilosAuth.principal}>
          <div style={{ ...estilosAuth.coluna, gap: 26 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={estilosAuth.eyebrow}>ETAPA 1 DE 1</span>
              <h2 style={estilosAuth.titulo}>Criar sua senha</h2>
              <p style={estilosAuth.texto}>Você entrou com a senha temporária. Defina uma senha própria para continuar.</p>
            </div>

            <form style={estilosAuth.form} onSubmit={e => { e.preventDefault(); enviar() }}>
              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Senha temporária</span>
                <PasswordInput value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="A senha que você recebeu" disabled={carregando}
                  style={{ ...estilosAuth.input, ...estilosAuth.inputSenha }} iconColor={cores.azulMedio} />
              </label>

              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Nova senha</span>
                <PasswordInput value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 8 caracteres" disabled={carregando}
                  style={{ ...estilosAuth.input, ...estilosAuth.inputSenha }} iconColor={cores.azulMedio} />
                <PasswordStrengthBar forca={forca} />
              </label>

              <label style={estilosAuth.campo}>
                <span style={estilosAuth.rotulo}>Confirmar nova senha</span>
                <PasswordInput value={confirmarNovaSenha} onChange={e => setConfirmarNovaSenha(e.target.value)} placeholder="Digite a nova senha novamente" disabled={carregando}
                  style={{ ...estilosAuth.input, ...estilosAuth.inputSenha }} iconColor={cores.azulMedio} />
                <ConfirmacaoSenha confirmar={confirmarNovaSenha} nova={novaSenha} />
              </label>

              {erro && <p style={{ color: cores.erro, fontSize: 13, margin: 0 }}>{erro}</p>}

              <button type="submit" disabled={!podeEnviar || carregando} style={podeEnviar && !carregando ? botaoVerde : botaoInativo}>
                {carregando ? 'Trocando...' : 'Salvar e continuar'}
              </button>

              <span style={{ fontSize: 13, color: cores.textoSuave }}>A senha temporária deixa de funcionar depois desta etapa.</span>
            </form>
          </div>
        </main>
      </div>
    )
  }

  // Modo voluntário (dentro do painel já logado) — layout de modal
  // compacto inalterado, agora em CORES_APP (tema claro).
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: CORES_APP.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onFechar}>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.25)', padding: '34px 30px', width: '100%', maxWidth: 400 }} className="animate-fade-up" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 21, color: CORES_APP.tinta, margin: '0 0 6px' }}>Trocar senha</h2>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: '0 0 26px', lineHeight: 1.6 }}>
          Informe sua senha atual e a nova senha desejada.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={estilos.label}>Senha atual</label>
            <PasswordInput value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••" disabled={carregando} />
          </div>
          <div>
            <label style={estilos.label}>Nova senha</label>
            <PasswordInput value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 8 caracteres" disabled={carregando} />
          </div>
          <div>
            <label style={estilos.label}>Confirmar nova senha</label>
            <PasswordInput value={confirmarNovaSenha} onChange={e => setConfirmarNovaSenha(e.target.value)} placeholder="Digite a nova senha novamente" disabled={carregando} />
          </div>
          {erro && <p style={{ color: CORES_APP.erro, fontSize: 13, margin: 0 }}>{erro}</p>}
          <button
            onClick={enviar}
            disabled={!podeEnviar || carregando}
            style={{ ...estilos.btnPrimary, marginTop: 6, opacity: podeEnviar && !carregando ? 1 : 0.45, cursor: podeEnviar && !carregando ? 'pointer' : 'not-allowed' }}
          >
            {carregando ? 'Trocando...' : 'Trocar senha'}
          </button>
          <button onClick={onFechar} disabled={carregando} style={{ background: 'none', border: 'none', color: CORES_APP.textoFraco, cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrocarSenhaModal
