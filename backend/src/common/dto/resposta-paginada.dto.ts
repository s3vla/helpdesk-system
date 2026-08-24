// Envelope padrão de toda listagem paginada do projeto — front sempre
// recebe { itens, total, pagina, totalPaginas }, nunca um array cru,
// então o componente <Paginacao/> (frontend) tem sempre o mesmo formato
// pra trabalhar independente de qual tela chamou.
export class RespostaPaginadaDto<T> {
  itens: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

// 10 por página é o padrão combinado — mudar aqui muda o padrão em TODA
// listagem paginada de uma vez (nenhum service deveria hardcodar "10" no
// próprio código).
const LIMITE_PADRAO = 10;

// Centraliza o cálculo de pagina/limite/skip — todo service paginado passa
// por aqui antes de montar a query, pra nunca ter duas contas de
// totalPaginas divergentes (ex: um lugar arredondando pra cima, outro não)
// e pra "página 0", "página negativa" ou "limite 0" nunca chegarem na
// query (o ValidationPipe já barra isso com @Min(1), mas os dois campos
// são opcionais — esta função é quem decide o valor quando vêm ausentes).
export function calcularPaginacao(
  paginaCrua?: number,
  limiteCru?: number,
): { pagina: number; limite: number; skip: number } {
  const pagina = paginaCrua && paginaCrua > 0 ? paginaCrua : 1;
  const limite = limiteCru && limiteCru > 0 ? limiteCru : LIMITE_PADRAO;
  return { pagina, limite, skip: (pagina - 1) * limite };
}

export function montarRespostaPaginada<T>(
  itens: T[],
  total: number,
  pagina: number,
  limite: number,
): RespostaPaginadaDto<T> {
  return {
    itens,
    total,
    pagina,
    // Math.max(1, ...) — mesmo com 0 itens no total, a UI sempre tem pelo
    // menos "página 1 de 1" pra mostrar, nunca "de 0".
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}
