import { useCallback } from 'react'

// Padrão compartilhado de toda textarea "de envio" do sistema: Enter
// (sem Shift) dispara a mesma ação que o botão de enviar/salvar/publicar
// do formulário já dispara; Shift+Enter mantém o comportamento padrão do
// textarea (quebra linha), sem nenhuma interferência.
//
// `aoEnviar` é sempre a função que o BOTÃO já chama (ex: `salvar`,
// `enviar`, `confirmar`) — a validação (campo obrigatório vazio etc.)
// mora inteira dentro dela, então o Enter herda de graça a mesma regra do
// botão, sem duplicar checagem nenhuma aqui.
export function useEnterParaEnviar(aoEnviar) {
  return useCallback((evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()
      aoEnviar()
    }
  }, [aoEnviar])
}
