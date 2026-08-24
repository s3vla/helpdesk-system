import { useLayoutEffect, useState } from 'react'
import { TEMA_CLARO, TEMA_ESCURO } from '../styles/theme'
import { ThemeContext } from './themeContextInstance'

// Preferência de tema só em memória (useState) — mesma decisão consciente
// já tomada pro token de login (ver AuthContext.jsx): nunca localStorage,
// reseta ao recarregar a página ou fazer login de novo.
export function ThemeProvider({ children }) {
  const [modo, setModo] = useState('claro')

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
    setModo(m => (m === 'claro' ? 'escuro' : 'claro'))
  }

  // Chamado pelo AuthContext em todo login/logout (inclusive sessão
  // expirada) — sem isso, o tema escolhido por uma conta continuava valendo
  // pra próxima conta que logasse na mesma aba, já que o ThemeProvider fica
  // acima do AuthProvider e nunca desmonta entre trocas de sessão.
  function resetarTema() {
    setModo('claro')
  }

  const valor = { modo, alternarTema, resetarTema }

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
}
