import { useEffect, useState } from 'react'

// Vários layouts (nav do colaborador, sidebar da TI, kanban) trocam de coluna
// para pilha vertical abaixo de certos breakpoints — esse hook centraliza a
// largura atual da janela para essas decisões de responsividade em JS.
export function useWindowWidth() {
  const [largura, setLargura] = useState(window.innerWidth)

  useEffect(() => {
    function aoRedimensionar() {
      setLargura(window.innerWidth)
    }
    window.addEventListener('resize', aoRedimensionar)
    return () => window.removeEventListener('resize', aoRedimensionar)
  }, [])

  return largura
}
