import { useContext } from 'react'
import { ThemeContext } from '../context/themeContextInstance'

// Atalho pra consumir o ThemeContext sem repetir useContext(ThemeContext)
// em toda tela, e com uma mensagem de erro clara se alguém tentar usar fora
// do <ThemeProvider> (ver main.jsx).
export function useTheme() {
  const contexto = useContext(ThemeContext)
  if (!contexto) throw new Error('useTheme precisa ser usado dentro de <ThemeProvider>')
  return contexto
}
