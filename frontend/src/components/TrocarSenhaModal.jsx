import { useState } from 'react'
import { estilos } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import PasswordInput from './PasswordInput'

// Modal de "Trocar minha senha" — funciona em dois modos:
// - `obrigatorio`: sem botão de cancelar, usado quando um técnico de seed
//   ainda não trocou a senha de bootstrap do .env (ver App.jsx, que decide
//   quando forçar isso a partir de `usuario.deveTrocarSenha`).
// - normal: acionado pela pessoa por vontade própria (link no menu do
//   usuário), pode ser fechado a qualquer momento.
// A senha ATUAL é sempre exigida — é o que garante que quem está trocando
// é o dono de verdade da conta, não alguém que só pegou uma sessão aberta.
function TrocarSenhaModal({ obrigatorio, onFechar, onSucesso }) {
  const { trocarSenha } = useAuth()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const podeEnviar = senhaAtual && novaSenha && confirmarNovaSenha

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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(4,10,22,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={obrigatorio ? undefined : onFechar}>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.25)', padding: '34px 30px', width: '100%', maxWidth: 400 }} className="animate-fade-up" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 21, color: '#f0f4ff', margin: '0 0 6px' }}>Trocar senha</h2>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 26px', lineHeight: 1.6 }}>
          {obrigatorio
            ? 'Por segurança, troque a senha temporária antes de continuar.'
            : 'Informe sua senha atual e a nova senha desejada.'}
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
          {erro && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{erro}</p>}
          <button
            onClick={enviar}
            disabled={!podeEnviar || carregando}
            style={{ ...estilos.btnPrimary, marginTop: 6, opacity: podeEnviar && !carregando ? 1 : 0.45, cursor: podeEnviar && !carregando ? 'pointer' : 'not-allowed' }}
          >
            {carregando ? 'Trocando...' : 'Trocar senha'}
          </button>
          {!obrigatorio && (
            <button onClick={onFechar} disabled={carregando} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrocarSenhaModal
