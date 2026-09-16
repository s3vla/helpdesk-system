// Extensão só pra dar um nome de arquivo legível ao print colado — a
// validação de verdade (o que é aceito/rejeitado) é toda no backend, via
// magic bytes, na mesma rota de upload usada pro clique em "Anexar
// imagem" (ver enviarImagem em services/ticketService.js). Cobre os
// mesmos 3 tipos que os `<input type="file" accept="...">` já aceitam.
const EXTENSAO_POR_TIPO = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

// Usado no onPaste de qualquer campo com upload de imagem (ver
// CreateTicket.jsx, ITAbrirChamado.jsx, ResolutionModal.jsx,
// TicketPanel.jsx) — devolve um File pronto pra entrar no MESMO estado
// que o <input type="file"> já preenche, ou `null` se a área de
// transferência não tiver imagem nenhuma (nesse caso o evento não é
// tocado, e colar texto continua funcionando normalmente).
export function extrairImagemColada(event) {
  const itens = event.clipboardData?.items
  if (!itens) return null

  for (const item of itens) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (!blob) continue
      // Só previne o comportamento padrão quando REALMENTE é uma imagem —
      // colar texto comum em qualquer um desses campos nunca passa por
      // aqui sem interferência.
      event.preventDefault()
      const extensao = EXTENSAO_POR_TIPO[item.type] ?? 'png'
      const nome = `print-colado-${Date.now()}.${extensao}`
      return new File([blob], nome, { type: item.type })
    }
  }
  return null
}
