import { useLayoutEffect, useState } from 'react'
import { TEMA_CLARO, TEMA_ESCURO } from '../styles/theme'
import { ThemeContext } from './themeContextInstance'

// Única exceção deliberada à regra de "nunca localStorage" — diferente do
// token de login (AuthContext.jsx), tema não é dado sensível: não
// identifica ninguém, não dá acesso a nada, e um script malicioso não
// ganha nada relevante lendo "claro" ou "escuro". Persistir só essa
// preferência entre sessões (inclusive fechar/reabrir o navegador) é uma
// troca com risco praticamente zero.
const CHAVE_TEMA = 'novatech-tema'

// Lida de forma síncrona, direto no useState (lazy initializer) — roda
// ANTES do primeiro render, então o tema salvo já está em `modo` desde o
// começo. Combinado com useLayoutEffect abaixo (que aplica as variáveis
// CSS antes do navegador pintar a tela), isso evita qualquer flash do
// tema errado, mesmo vindo de uma preferência salva.
function lerTemaSalvo() {
  try {
    return localStorage.getItem(CHAVE_TEMA) === 'escuro' ? 'escuro' : 'claro'
  } catch {
    // localStorage pode estar bloqueado (aba anônima, navegador
    // configurado pra recusar) — degrada pro padrão "claro", nunca quebra
    // o carregamento da página por causa disso.
    return 'claro'
  }
}

export function ThemeProvider({ children }) {
  const [modo, setModo] = useState(lerTemaSalvo)

  // useLayoutEffect (não useEffect) pra escrever as variáveis CSS antes do
  // navegador pintar a tela — evita um flash com o tema errado ao alternar.
  useLayoutEffect(() => {
    const tokens = modo === 'escuro' ? TEMA_ESCURO : TEMA_CLARO
    const raiz = document.documentElement
    for (const [chave, valor] of Object.entries(tokens)) {
      raiz.style.setProperty(`--app-${chave}`, valor)
    }
    raiz.dataset.theme = modo
  }, [modo])

  function alternarTema() {
    setModo((m) => {
      const novo = m === 'claro' ? 'escuro' : 'claro'
      try {
        localStorage.setItem(CHAVE_TEMA, novo)
      } catch {
        // Sem persistência nesse caso (mesmo motivo do try/catch acima) —
        // o tema ainda troca normalmente pro resto desta sessão, só não
        // sobrevive a um reload.
      }
      return novo
    })
  }

  const valor = { modo, alternarTema }

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
}
