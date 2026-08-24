// Como o WidgetRenderer (frontend) desenha os dados de um widget — decisão
// puramente de apresentação, não muda o formato da resposta de
// /chamados/metricas nem /chamados/repeticao.
export enum FormatoVisualWidget {
  BARRA = 'barra',
  PIZZA = 'pizza',
  LISTA = 'lista',
}
