// Agrupamento de "chamados que se repetem" pro Dashboard TI — reaproveita a
// MESMA lógica de correspondência que SolucoesConhecidasService.sugerirParaChamado
// já usa par-a-par (mesma categoria + similaridade acima do limiar mínimo),
// só que aplicada ao conjunto inteiro do período de uma vez, em vez de
// comparado contra 1 chamado alvo.
import {
  calcularSimilaridade,
  extrairPalavrasChave,
  LIMIAR_SIMILARIDADE_MINIMA,
} from '../solucoes-conhecidas/palavras-chave.util';

const MAXIMO_GRUPOS = 10;

// `categoria` é o NOME (string) — era CategoriaChamado (enum fixo) antes de
// virar uma tabela administrável (ver Categoria entity). Quem chama passa
// `chamado.categoria.nome`, nunca a entity inteira.
export interface ChamadoParaAgrupamento {
  categoria: string;
  descricao: string;
  mensagemErro: string | null;
}

export interface GrupoRepetido {
  categoria: string;
  rotulo: string;
  total: number;
}

function capitalizar(palavra: string): string {
  if (!palavra) return palavra;
  return palavra.charAt(0).toUpperCase() + palavra.slice(1);
}

// Palavra que aparece no maior número de chamados do grupo (não soma
// repetições dentro de um mesmo chamado, já que cada conjunto vem de
// extrairPalavrasChave, que é um Set) — é essa frequência que melhor
// representa "o assunto comum do grupo". Em empate, mantém a primeira
// encontrada: não há nenhum outro sinal disponível aqui pra desempatar.
function palavraMaisFrequente(conjuntos: Set<string>[]): string {
  const contagem = new Map<string, number>();
  for (const conjunto of conjuntos) {
    for (const palavra of conjunto) {
      contagem.set(palavra, (contagem.get(palavra) ?? 0) + 1);
    }
  }

  let melhor = '';
  let maiorContagem = 0;
  for (const [palavra, total] of contagem) {
    if (total > maiorContagem) {
      melhor = palavra;
      maiorContagem = total;
    }
  }
  return melhor;
}

// Agrupamento guloso por "semente": dentro de cada categoria, cada chamado
// ainda não agrupado inicia um grupo novo, puxando pra dentro dele todo
// outro chamado da mesma categoria cuja similaridade com ele passe do
// limiar mínimo (calcularSimilaridade >= LIMIAR_SIMILARIDADE_MINIMA —
// mesmo critério de sugerirParaChamado, ver palavras-chave.util.ts).
// Simplificação deliberada: é agrupamento por semente,
// não uma clusterização transitiva completa (união de conjuntos via
// union-find) — mais simples de explicar e reaproveita o utilitário
// existente sem inventar lógica nova de similaridade. Só grupos com 2+
// chamados entram no resultado (senão não é "repetição"), ordenados por
// tamanho, no máximo os 10 maiores.
export function agruparChamadosRepetidos(
  chamados: ChamadoParaAgrupamento[],
): GrupoRepetido[] {
  const porCategoria = new Map<string, ChamadoParaAgrupamento[]>();
  for (const chamado of chamados) {
    const lista = porCategoria.get(chamado.categoria) ?? [];
    lista.push(chamado);
    porCategoria.set(chamado.categoria, lista);
  }

  const grupos: GrupoRepetido[] = [];

  for (const [categoria, chamadosDaCategoria] of porCategoria) {
    const itens = chamadosDaCategoria.map((chamado) => ({
      palavras: extrairPalavrasChave(
        `${chamado.descricao} ${chamado.mensagemErro ?? ''}`,
      ),
      usado: false,
    }));

    for (let i = 0; i < itens.length; i++) {
      if (itens[i].usado) continue;
      itens[i].usado = true;
      const grupo = [itens[i]];

      for (let j = i + 1; j < itens.length; j++) {
        if (itens[j].usado) continue;
        if (
          calcularSimilaridade(itens[i].palavras, itens[j].palavras) >=
          LIMIAR_SIMILARIDADE_MINIMA
        ) {
          itens[j].usado = true;
          grupo.push(itens[j]);
        }
      }

      if (grupo.length < 2) continue;

      grupos.push({
        categoria,
        rotulo: capitalizar(
          palavraMaisFrequente(grupo.map((item) => item.palavras)),
        ),
        total: grupo.length,
      });
    }
  }

  return grupos.sort((a, b) => b.total - a.total).slice(0, MAXIMO_GRUPOS);
}
