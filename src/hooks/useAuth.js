import { useContext } from 'react'
import { AuthContext } from '../context/authContextInstance'

// Atalho pra consumir o AuthContext sem repetir useContext(AuthContext) em
// toda tela, e com uma mensagem de erro clara se alguém tentar usar fora do
// <AuthProvider> (ver main.jsx).
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>')
  return contexto
}
