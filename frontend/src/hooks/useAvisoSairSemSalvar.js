import { useEffect } from 'react'

// Registra o listener de `beforeunload` só enquanto `temMudancasNaoSalvas`
// for true — nunca fica pendurado o tempo todo, senão o navegador
// perguntaria "sair da página?" em qualquer F5/fechamento, mesmo com o
// formulário vazio. Cada tela que usa isso decide sozinha o que conta
// como "mudança não salva" (ex: `desc.trim() !== '' || arquivos.length > 0`)
// e passa o resultado já calculado.
//
// IMPORTANTE: navegadores modernos (Chrome, Firefox, Safari) ignoram
// qualquer texto customizado por segurança — sempre mostram a própria
// mensagem genérica do navegador ("Saia do site? As alterações que você
// fez podem não ser salvas."), independente do que passarmos em
// `e.returnValue`. `preventDefault()` + `returnValue` é só o gatilho pra
// esse aviso nativo aparecer — não dá pra personalizar o texto.
export function useAvisoSairSemSalvar(temMudancasNaoSalvas) {
  useEffect(() => {
    if (!temMudancasNaoSalvas) return

    function aoTentarSair(e) {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', aoTentarSair)
    return () => window.removeEventListener('beforeunload', aoTentarSair)
  }, [temMudancasNaoSalvas])
}
