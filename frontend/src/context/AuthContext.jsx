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
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [mensagemSessao, setMensagemSessao] = useState('')

  async function login(email, senha) {
    const resposta = await chamarApi('/auth/login', { metodo: 'POST', corpo: { email, senha } })
    // mapearUsuario traduz o formato bruto da API (nome, cargo,
    // departamento) pro formato em inglês (name, role, dept) que
    // EmployeeLayout e as demais telas já usam desde o protótipo.
    const usuarioMapeado = mapearUsuario(resposta.usuario)
    setToken(resposta.accessToken)
    setUsuario(usuarioMapeado)
    setMensagemSessao('')
    return usuarioMapeado
  }

  async function primeiroAcesso(dados) {
    const resposta = await chamarApi('/auth/primeiro-acesso', { metodo: 'POST', corpo: dados })
    const usuarioMapeado = mapearUsuario(resposta.usuario)
    setToken(resposta.accessToken)
    setUsuario(usuarioMapeado)
    setMensagemSessao('')
    return usuarioMapeado
  }

  function logout() {
    setToken(null)
    setUsuario(null)
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
