import { useState } from 'react'
import { estilos } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import PasswordInput from './PasswordInput'

// Modal de "Primeiro Acesso": cadastra um colaborador novo direto pela API
// (POST /auth/primeiro-acesso) e já entra logado com o token recebido de
// volta — por isso chama useAuth().primeiroAcesso aqui dentro, em vez de só
// coletar dados e devolver pro componente pai.
//
// Diferente da versão anterior (mockada), o backend exige senha — por isso
// os campos de senha/confirmar senha foram adicionados aqui, exatamente
// como o CONTRATO.md da API pedia. O e-mail também virou um campo editável
// (pré-preenchido com o que a pessoa já tinha digitado no login, se algo):
// como o backend nunca revela se um e-mail já existe ou não (resposta
// genérica em caso de erro de login, por segurança), não dá mais pra
// "detectar" automaticamente que alguém precisa de primeiro acesso.
function FirstAccessModal({ emailInicial, onSucesso, onFechar }) {
  const { primeiroAcesso } = useAuth()
  const [email, setEmail] = useState(emailInicial ?? '')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const podeContinuar = email.trim() && name.trim() && role.trim() && senha && confirmarSenha

  async function enviar() {
    if (!podeContinuar) return
    if (!email.toLowerCase().endsWith('@novatechagro.com.br')) {
      setErro('Use seu e-mail corporativo @novatechagro.com.br')
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
      await primeiroAcesso({ email: email.trim(), senha, nome: name.trim(), cargo: role.trim() })
      onSucesso()
    } catch (e) {
      setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(4,10,22,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onFechar}>
      <div style={{ ...estilos.card, border: '1px solid rgba(0,120,81,0.25)', padding: '34px 30px', width: '100%', maxWidth: 400 }} className="animate-fade-up" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 21, color: '#f0f4ff', margin: '0 0 6px' }}>Primeiro acesso</h2>
        <p style={{ color: '#7b92b4', fontSize: 14, margin: '0 0 26px', lineHeight: 1.6 }}>Precisamos de mais algumas informações para configurar sua conta.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={estilos.label}>E-mail corporativo</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu.nome@novatechagro.com.br" style={estilos.input} disabled={carregando} />
          </div>
          <div>
            <label style={estilos.label}>Nome completo</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" style={estilos.input} disabled={carregando} />
          </div>
          <div>
            <label style={estilos.label}>Cargo</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Analista de Campo" style={estilos.input} disabled={carregando} />
          </div>
          <div>
            <label style={estilos.label}>Senha</label>
            <PasswordInput value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" disabled={carregando} />
          </div>
          <div>
            <label style={estilos.label}>Confirmar senha</label>
            <PasswordInput value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="Digite a senha novamente" disabled={carregando} />
          </div>
          {erro && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{erro}</p>}
          <button
            onClick={enviar}
            disabled={!podeContinuar || carregando}
            style={{ ...estilos.btnPrimary, marginTop: 6, opacity: podeContinuar && !carregando ? 1 : 0.45, cursor: podeContinuar && !carregando ? 'pointer' : 'not-allowed' }}
          >
            {carregando ? 'Criando conta...' : 'Continuar'}
          </button>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', color: '#7b92b4', cursor: 'pointer', fontSize: 13 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default FirstAccessModal
