// Item de resposta de GET /chamados/metricas. `chave` é o valor bruto do
// agrupamento (enum como string, ou o id numérico do usuário quando
// agruparPor=solicitante/tecnicoResponsavel) — usado como chave de item no
// frontend E como chave de tradução (ex: LABEL_CATEGORIA[chave]). `rotulo`
// é igual a `chave` pros agrupamentos por enum (o frontend já tem os
// dicionários de tradução) e é o nome da pessoa pros agrupamentos por id
// (não dá pra derivar um nome só a partir do id no frontend).
export class MetricaItemResponseDto {
  chave: string | number;
  rotulo: string;
  total: number;
}
