import { useCallback, useState } from 'react'
import { chamarApi, ErroApi } from '../services/apiClient'
import { mapearUsuario } from '../services/ticketService'
import { AuthContext } from './authContextInstance'

// Guarda o token JWT e o usuário logado SÓ em memória (useState) — nunca em
// localStorage/sessionStorage. Motivo: qualquer script que rode na página
// (inclusive um script malicioso injetado por uma falha de XSS em algum
// lugar do app) consegue ler o que estiver no localStorage/sessionStorage
// livremente, porque são APIs do próprio navegador acessíveis via
// JavaScript. Estado do React não tem esse problema — só existe na memória
// da aba, e some sozinho ao fechar ou recarregar a página. A troca
// consciente aqui é: perde-se a comodidade de continuar logado após dar
// refresh, ganha-se não ter o token roubável por um script injetado.
//
// CHAVE_SESSAO_ATIVA guarda só um marcador booleano em sessionStorage —
// NUNCA o token nem qualquer dado sensível — só pra distinguir, na tela de
// login, "primeira vez nessa aba" de "essa aba tinha uma sessão ativa e a
// perdeu" (reload/fechamento acidental). Marcador sem valor nenhum sozinho
// (não autentica nada), então não reabre a exceção de segurança acima.
const CHAVE_SESSAO_ATIVA = 'helpdesk_sessao_ativa'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [usuario, setUsuario] = useState(null)
  // Inicializado uma única vez, no primeiro render: se o marcador de
  // sessionStorage existir aqui, é porque ESTA aba tinha uma sessão ativa
  // antes desse mount — ou seja, a pessoa chegou na tela de login por causa
  // de um F5/reload (o token em memória sempre some nesse caso, decisão de
  // segurança de cima), não porque é a primeira vez. Mensagem diferente da
  // de `tratarErroApi` (sessão expirando NO MEIO do uso, sem reload) — aqui
  // a sessão em si continuava válida, só a aba "esqueceu" o token.
  // try/catch: sessionStorage pode estar bloqueado (aba anônima com
  // storage desligado) — nesse caso só não mostra a mensagem, nunca quebra
  // o login.
  const [mensagemSessao, setMensagemSessao] = useState(() => {
    try {
      if (sessionStorage.getItem(CHAVE_SESSAO_ATIVA)) {
        sessionStorage.removeItem(CHAVE_SESSAO_ATIVA)
        return 'Sua sessão anterior foi encerrada (a página foi recarregada ou fechada). Faça login novamente.'
      }
    } catch {
      // sessionStorage indisponível — segue sem mensagem.
    }
    return ''
  })
  // Marca a aba como "com sessão ativa" — lido só no próximo mount (ver
  // useState acima). Falha de storage aqui não pode travar o login.
  function marcarSessaoAtiva() {
    try {
      sessionStorage.setItem(CHAVE_SESSAO_ATIVA, '1')
    } catch {
      // sessionStorage indisponível — sem marcador, próximo reload cai no
      // fluxo normal de "primeira vez" em vez de mostrar a mensagem certa.
      // Degradação aceitável, não é motivo pra travar o login.
    }
  }

  function limparMarcadorSessao() {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO_ATIVA)
    } catch {
      // idem — sem efeito prático se já estava indisponível.
    }
  }

  // `perfilEsperado` ('COLABORADOR' | 'TECNICO') vem de qual tela chamou —
  // o backend recusa (403, ANTES de emitir token) se o `tipo` real do
  // usuário não bater com isso, então nunca existe sessão criada pro perfil
  // errado (ver AuthService.login no backend).
  async function login(email, senha, perfilEsperado) {
    const resposta = await chamarApi('/auth/login', { metodo: 'POST', corpo: { email, senha, perfilEsperado } })
    // mapearUsuario traduz o formato bruto da API (nome, cargo,
    // departamento) pro formato em inglês (name, role, dept) que
    // EmployeeLayout e as demais telas já usam desde o protótipo.
    const usuarioMapeado = mapearUsuario(resposta.usuario)
    setToken(resposta.accessToken)
    setUsuario(usuarioMapeado)
    setMensagemSessao('')
    marcarSessaoAtiva()
    return usuarioMapeado
  }

  async function primeiroAcesso(dados) {
    const resposta = await chamarApi('/auth/primeiro-acesso', { metodo: 'POST', corpo: dados })
    const usuarioMapeado = mapearUsuario(resposta.usuario)
    setToken(resposta.accessToken)
    setUsuario(usuarioMapeado)
    setMensagemSessao('')
    marcarSessaoAtiva()
    return usuarioMapeado
  }

  function logout() {
    setToken(null)
    setUsuario(null)
    // Saída deliberada — sem marcador, a próxima ida pra tela de login não
    // deve dizer "sua sessão foi encerrada" (a pessoa já sabe, foi ela quem
    // saiu).
    limparMarcadorSessao()
  }

  // Troca a senha de quem está logado. A API devolve um accessToken NOVO
  // (o antigo para de funcionar assim que a senha muda — ver JwtStrategy no
  // backend), então precisamos trocar o token guardado aqui também, não só
  // o usuário — senão a próxima chamada usaria um token já inválido.
  async function trocarSenha(dados) {
    const resposta = await chamarApi('/auth/minha-senha', { token, metodo: 'PATCH', corpo: dados })
    const usuarioMapeado = mapearUsuario(resposta.usuario)
    setToken(resposta.accessToken)
    setUsuario(usuarioMapeado)
    return usuarioMapeado
  }

  // Chamada pelas telas dentro de um catch de chamada à API. Se o erro for
  // um 401 (token recusado) E já havia um token guardado — ou seja, não é
  // uma tentativa de login que falhou, é uma sessão que expirou no meio do
  // uso — desloga e prepara a mensagem que a tela de login vai mostrar.
  // Devolve `true` nesse caso para quem chamou saber que não precisa exibir
  // seu próprio erro (a pessoa já está sendo redirecionada pro login).
  const tratarErroApi = useCallback(
    (erro) => {
      if (erro instanceof ErroApi && erro.status === 401 && token) {
        setToken(null)
        setUsuario(null)
        setMensagemSessao('Sua sessão expirou. Faça login novamente.')
        // Mensagem já foi mostrada agora, sem precisar de reload — remove o
        // marcador pra um reload seguinte (antes de logar de novo) não
        // mostrar a mensagem de "sessão perdida" por cima, redundante.
        limparMarcadorSessao()
        return true
      }
      return false
    },
    [token],
  )

  function limparMensagemSessao() {
    setMensagemSessao('')
  }

  const valor = { token, usuario, login, primeiroAcesso, logout, trocarSenha, tratarErroApi, mensagemSessao, limparMensagemSessao }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
