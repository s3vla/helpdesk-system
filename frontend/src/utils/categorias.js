// Categorias de chamado — o valor interno (usado no estado dos componentes
// e enviado pra API via CATEGORIA_PARA_API em ticketService.js) continua
// sendo o nome técnico da categoria, igual ao enum do backend. LABEL_CATEGORIA
// só controla o TEXTO exibido na tela, escolhido pra fazer sentido pra quem
// não é da área de TI (ex: "Internet/Wi-Fi" em vez de "Rede") — trocar aqui
// não afeta o que é salvo no banco nem os filtros que já dependem do valor
// interno.
export const CATEGORIAS = ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro']

export const LABEL_CATEGORIA = {
  Hardware: 'Computador/Impressora',
  Software: 'Programas',
  Rede: 'Internet/Wi-Fi',
  Acesso: 'Sistema',
  Outro: 'Outro',
}
