import { createContext } from 'react'

// Só o objeto de contexto em si, sem nenhum componente — separado do
// AuthProvider (AuthContext.jsx) porque um arquivo que exporta um
// componente E outras coisas quebra o React Fast Refresh (o oxlint já
// avisa disso: "Move your React context(s) to a separate file").
export const AuthContext = createContext(null)
