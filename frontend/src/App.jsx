import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import ITLoginScreen from './components/ITLoginScreen'
import EmployeeLayout from './components/EmployeeLayout'
import CreateTicket from './components/CreateTicket'
import TicketSent from './components/TicketSent'
import MyTickets from './components/MyTickets'
import AcompanhandoTickets from './components/AcompanhandoTickets'
import ITLayout from './components/ITLayout'
import ITDashboard from './components/ITDashboard'
import ITUsers from './components/ITUsers'
import ITUserDetail from './components/ITUserDetail'
import ITSolutions from './components/ITSolutions'
import ITAbrirChamado from './components/ITAbrirChamado'
import TicketPanel from './components/TicketPanel'
import TrocarSenhaModal from './components/TrocarSenhaModal'
import { useAuth } from './hooks/useAuth'

const TELAS_COLABORADOR = ['emp-home', 'emp-tickets', 'emp-observing', 'emp-sent']
const TELAS_TI = ['it-dash', 'it-users', 'it-user', 'it-solutions', 'it-abrir-chamado']

// App.jsx só orquestra qual tela mostrar — não guarda mais usuários/chamados
// centralizados (isso agora vive na API, cada tela busca o que precisa via
// useAuth() + ticketService). O que sobra aqui:
// - saber se tem alguém logado (via useAuth) e, se não, qual tela de login
//   mostrar;
// - saber em qual tela do "mundo" logado a pessoa está;
// - o estado do painel de chamado/colaborador selecionado, compartilhado
//   entre telas;
// - `versaoDados`, um contador que avisa as listas pra buscar de novo
//   sempre que o TicketPanel muda algo (status, comentário) — como cada
//   tela busca seus próprios dados de forma independente, esse é o jeito
//   simples de "avisar" quem está montado no momento.
function App() {
  const { usuario, logout } = useAuth()
  const [telaLogin, setTelaLogin] = useState('login')
  const [tela, setTela] = useState('emp-home')
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null)
  const [versaoDados, setVersaoDados] = useState(0)
  const [mostrarTrocarSenha, setMostrarTrocarSenha] = useState(false)

  function aoAtualizarChamado() {
    setVersaoDados(v => v + 1)
  }

  function aoDeslogar() {
    logout()
    setTelaLogin('login')
    setChamadoSelecionado(null)
    setUsuarioSelecionado(null)
  }

  // ── Sem sessão: telas de login ──────────────────────────────────────────
  if (!usuario) {
    return telaLogin === 'login'
      ? <LoginScreen onLoginColaborador={() => setTela('emp-home')} onSwitchIT={() => setTelaLogin('it-login')} />
      : <ITLoginScreen onLoginTecnico={() => setTela('it-dash')} onBack={() => setTelaLogin('login')} />
  }

  // Técnico recém-seedado ainda usando a senha de bootstrap do .env — nada
  // do Painel TI aparece até trocar. Sem botão de cancelar (`obrigatorio`):
  // ao trocar com sucesso, `usuario.deveTrocarSenha` vira false pela
  // resposta da própria API (ver AuthContext.trocarSenha), então este
  // bloco simplesmente para de bater e o Painel TI aparece sozinho.
  if (usuario.deveTrocarSenha) {
    return <TrocarSenhaModal obrigatorio />
  }

  // ── Telas do colaborador ───────────────────────────────────────────────
  if (usuario.tipo === 'COLABORADOR') {
    const telaColaborador = TELAS_COLABORADOR.includes(tela) ? tela : 'emp-home'
    const telaAtivaNav = telaColaborador === 'emp-sent' ? 'emp-home' : telaColaborador
    return (
      <EmployeeLayout
        user={usuario}
        telaAtiva={telaAtivaNav}
        onNav={s => { setChamadoSelecionado(null); setTela(s) }}
        onLogout={aoDeslogar}
        onTrocarSenha={() => setMostrarTrocarSenha(true)}
      >
        {telaColaborador === 'emp-sent' && (
          <TicketSent onNew={() => setTela('emp-home')} onView={() => setTela('emp-tickets')} />
        )}
        {telaColaborador === 'emp-home' && (
          <CreateTicket onSubmit={() => setTela('emp-sent')} />
        )}
        {telaColaborador === 'emp-tickets' && (
          <MyTickets versaoDados={versaoDados} onSelect={setChamadoSelecionado} />
        )}
        {telaColaborador === 'emp-observing' && (
          <AcompanhandoTickets versaoDados={versaoDados} onSelect={setChamadoSelecionado} />
        )}
        {chamadoSelecionado && (
          <TicketPanel
            chamadoInicial={chamadoSelecionado}
            onClose={() => setChamadoSelecionado(null)}
            isIT={false}
            onAtualizado={aoAtualizarChamado}
          />
        )}
        {mostrarTrocarSenha && (
          <TrocarSenhaModal onFechar={() => setMostrarTrocarSenha(false)} onSucesso={() => setMostrarTrocarSenha(false)} />
        )}
      </EmployeeLayout>
    )
  }

  // ── Telas da Área Técnica ──────────────────────────────────────────────
  const telaTI = TELAS_TI.includes(tela) ? tela : 'it-dash'
  return (
    <ITLayout
      tela={telaTI}
      onNav={s => {
        setUsuarioSelecionado(null)
        setChamadoSelecionado(null)
        setTela(s)
      }}
      onLogout={aoDeslogar}
      onTrocarSenha={() => setMostrarTrocarSenha(true)}
    >
      {telaTI === 'it-dash' && (
        <ITDashboard versaoDados={versaoDados} onSelect={setChamadoSelecionado} />
      )}
      {telaTI === 'it-users' && (
        <ITUsers onSelect={u => { setUsuarioSelecionado(u); setTela('it-user') }} />
      )}
      {telaTI === 'it-user' && usuarioSelecionado && (
        <ITUserDetail usuario={usuarioSelecionado} versaoDados={versaoDados} onVoltar={() => setTela('it-users')} onSelect={setChamadoSelecionado} />
      )}
      {telaTI === 'it-solutions' && <ITSolutions />}
      {telaTI === 'it-abrir-chamado' && (
        <ITAbrirChamado onSubmit={() => { aoAtualizarChamado(); setTela('it-dash') }} />
      )}
      {chamadoSelecionado && (
        <TicketPanel
          chamadoInicial={chamadoSelecionado}
          onClose={() => setChamadoSelecionado(null)}
          isIT={true}
          onAtualizado={aoAtualizarChamado}
        />
      )}
      {mostrarTrocarSenha && (
        <TrocarSenhaModal onFechar={() => setMostrarTrocarSenha(false)} onSucesso={() => setMostrarTrocarSenha(false)} />
      )}
    </ITLayout>
  )
}

export default App
