import { createContext } from 'react'

// Só o objeto de contexto em si, separado do ThemeProvider (ThemeContext.jsx)
// pelo mesmo motivo de authContextInstance.js: um arquivo que exporta um
// componente E outras coisas quebra o React Fast Refresh.
export const ThemeContext = createContext(null)
