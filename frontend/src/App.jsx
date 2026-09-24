import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import Administracao from './components/Administracao'
import ITAbrirChamado from './components/ITAbrirChamado'
import DashboardTI from './components/DashboardTI'
import CriarDashboard from './components/CriarDashboard'
import MuralAvisos from './components/MuralAvisos'
import MinhasTarefas from './components/MinhasTarefas'
import MinhasAnotacoes from './components/MinhasAnotacoes'
import Forum from './components/Forum'
import TicketPanel from './components/TicketPanel'
import TrocarSenhaModal from './components/TrocarSenhaModal'
import { useAuth } from './hooks/useAuth'
import { buscarContagemNaoLidos } from './services/avisosService'
import { URL_BASE } from './services/apiClient'

const TELAS_COLABORADOR = ['emp-home', 'emp-tickets', 'emp-observing', 'emp-sent', 'emp-avisos', 'emp-tarefas', 'emp-anotacoes', 'emp-forum']
const TELAS_TI = ['it-dash', 'it-admin', 'it-users', 'it-user', 'it-solutions', 'it-abrir-chamado', 'it-metricas', 'it-metricas-config', 'it-avisos', 'it-tarefas', 'it-forum']

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
  const { usuario, token, logout } = useAuth()
  const [telaLogin, setTelaLogin] = useState('login')
  const [tela, setTela] = useState('emp-home')
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null)
  const [versaoDados, setVersaoDados] = useState(0)
  const [mostrarTrocarSenha, setMostrarTrocarSenha] = useState(false)
  const [contagemAvisos, setContagemAvisos] = useState(0)
  const [modoDemo, setModoDemo] = useState(false)

  // Busca única, sem token (rota raiz, fora do prefixo /api) — só pra
  // decidir se mostra o aviso de ambiente de demonstração no login. Padrão
  // sempre começa em `false`: se a busca falhar ou nunca responder, o
  // aviso simplesmente não aparece (nunca o contrário).
  useEffect(() => {
    // `/api` explícito aqui: a rota raiz do AppController vive sob esse
    // prefixo (ver main.ts, app.setGlobalPrefix('api')) — GET na origem
    // sem esse caminho cai no catch-all do ServeStaticModule (serve o
    // index.html do frontend), não na resposta JSON de status.
    fetch(`${URL_BASE}/api`)
      .then(r => r.json())
      .then(dados => setModoDemo(dados?.modoDemo === true))
      .catch(() => {})
  }, [])

  function aoAtualizarChamado() {
    setVersaoDados(v => v + 1)
  }

  // Badge da sidebar do colaborador (ver EmployeeLayout) — busca ao logar e
  // de novo sempre que MuralAvisos avisa que algo mudou (abriu o mural,
  // técnico excluiu um aviso etc.). Só pro colaborador: técnico não tem
  // badge nesta etapa (ver plano aprovado do Mural de Avisos).
  function atualizarContagemAvisos() {
    if (usuario?.tipo !== 'COLABORADOR') return
    buscarContagemNaoLidos(token).then(setContagemAvisos).catch(() => {})
  }

  useEffect(() => {
    atualizarContagemAvisos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, token])

  function aoDeslogar() {
    logout()
    setTelaLogin('login')
    setChamadoSelecionado(null)
    setUsuarioSelecionado(null)
  }

  // ── Sem sessão: telas de login ──────────────────────────────────────────
  if (!usuario) {
    return telaLogin === 'login'
      ? <LoginScreen onLoginColaborador={() => setTela('emp-home')} onSwitchIT={() => setTelaLogin('it-login')} modoDemo={modoDemo} />
      : <ITLoginScreen onLoginTecnico={() => setTela('it-dash')} onBack={() => setTelaLogin('login')} />
  }

  // Alguém ainda usando uma senha que OUTRA pessoa escolheu — técnico
  // recém-seedado (senha de bootstrap do .env) ou colaborador cadastrado
  // direto pelo técnico (ver AuthService.cadastrarColaborador). Nada do
  // painel (TI ou colaborador) aparece até trocar. Sem botão de cancelar
  // (`obrigatorio`): ao trocar com sucesso, `usuario.deveTrocarSenha` vira
  // false pela resposta da própria API (ver AuthContext.trocarSenha), então
  // este bloco simplesmente para de bater e o painel aparece sozinho.
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
        larguraMaxima={telaColaborador === 'emp-home' ? 1280 : 840}
        contagemAvisos={contagemAvisos}
      >
        {telaColaborador === 'emp-sent' && (
          <TicketSent onNew={() => setTela('emp-home')} onView={() => setTela('emp-tickets')} />
        )}
        {telaColaborador === 'emp-home' && (
          <CreateTicket onSubmit={() => setTela('emp-sent')} onSelect={setChamadoSelecionado} />
        )}
        {telaColaborador === 'emp-tickets' && (
          <MyTickets versaoDados={versaoDados} onSelect={setChamadoSelecionado} />
        )}
        {telaColaborador === 'emp-observing' && (
          <AcompanhandoTickets versaoDados={versaoDados} onSelect={setChamadoSelecionado} />
        )}
        {telaColaborador === 'emp-avisos' && (
          <MuralAvisos podePublicar={false} onAlterou={atualizarContagemAvisos} />
        )}
        {telaColaborador === 'emp-tarefas' && <MinhasTarefas />}
        {telaColaborador === 'emp-anotacoes' && <MinhasAnotacoes />}
        {telaColaborador === 'emp-forum' && <Forum podeAlterarStatus={false} />}
        {/* AnimatePresence aqui (não dentro de TicketPanel) — mesmo
            raciocínio de ResolutionModal.jsx: é este ponto de montagem
            condicional que precisa "segurar" o componente montado durante
            a animação de saída. */}
        <AnimatePresence>
          {chamadoSelecionado && (
            <TicketPanel
              key="ticket-panel-colaborador"
              chamadoInicial={chamadoSelecionado}
              onClose={() => setChamadoSelecionado(null)}
              isIT={false}
              onAtualizado={aoAtualizarChamado}
            />
          )}
        </AnimatePresence>
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
      usuario={usuario}
      onNav={s => {
        setUsuarioSelecionado(null)
        setChamadoSelecionado(null)
        setTela(s)
      }}
      onLogout={aoDeslogar}
      onTrocarSenha={() => setMostrarTrocarSenha(true)}
    >
      {telaTI === 'it-dash' && (
        <ITDashboard versaoDados={versaoDados} onSelect={setChamadoSelecionado} onAbrirChamado={() => setTela('it-abrir-chamado')} />
      )}
      {telaTI === 'it-admin' && <Administracao />}
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
      {telaTI === 'it-metricas' && <DashboardTI />}
      {telaTI === 'it-metricas-config' && <CriarDashboard />}
      {telaTI === 'it-avisos' && <MuralAvisos podePublicar={true} />}
      {telaTI === 'it-tarefas' && <MinhasTarefas />}
      {telaTI === 'it-forum' && <Forum podeAlterarStatus={true} />}
      <AnimatePresence>
        {chamadoSelecionado && (
          <TicketPanel
            key="ticket-panel-tecnico"
            chamadoInicial={chamadoSelecionado}
            onClose={() => setChamadoSelecionado(null)}
            isIT={true}
            onAtualizado={aoAtualizarChamado}
          />
        )}
      </AnimatePresence>
      {mostrarTrocarSenha && (
        <TrocarSenhaModal onFechar={() => setMostrarTrocarSenha(false)} onSucesso={() => setMostrarTrocarSenha(false)} />
      )}
    </ITLayout>
  )
}

export default App
