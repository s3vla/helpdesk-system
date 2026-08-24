import { useEffect, useState } from 'react'

// Textos como "aberto há 2h"/"sem resposta há 12min" são calculados a partir
// de `Date.now()` no momento do render — sem isso, eles ficam parados até a
// próxima ação do usuário forçar um re-render. Este hook só existe pra dar
// esse empurrão: incrementa um contador a cada `intervaloMs`, o componente
// que o usa re-renderiza, e as funções de formatação recalculam sozinhas.
// Não guarda a hora em si — quem precisa do valor formatado continua
// chamando tempoDecorrido() normalmente.
export function useAgora(intervaloMs = 60000) {
  const [, forcarRender] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forcarRender(v => v + 1), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
}
