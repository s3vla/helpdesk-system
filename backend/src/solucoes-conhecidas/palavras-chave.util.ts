// Comparação "nada sofisticada" de palavras-chave entre descrições de
// chamado — sem IA, sem embeddings, só contar quantas palavras
// significativas duas descrições têm em comum. Fica num arquivo próprio
// (função pura, sem dependência de banco) pra ficar fácil de testar e de
// achar, separado da lógica de acesso a dados do service.

// Lista curta de palavras comuns do português que não ajudam a identificar
// o ASSUNTO de um chamado (preposições, artigos, conectivos) — sem essa
// lista, duas descrições quaisquer quase sempre teriam "de"/"que"/"não" em
// comum, o que inflaria a pontuação sem significar nada.
const PALAVRAS_IGNORADAS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'a',
  'o',
  'as',
  'os',
  'e',
  'ou',
  'que',
  'em',
  'um',
  'uma',
  'uns',
  'umas',
  'para',
  'pra',
  'pro',
  'com',
  'sem',
  'não',
  'na',
  'no',
  'nas',
  'nos',
  'se',
  'por',
  'pelo',
  'pela',
  'pelos',
  'pelas',
  'mais',
  'menos',
  'como',
  'mas',
  'foi',
  'ao',
  'aos',
  'tem',
  'ser',
  'está',
  'estou',
  'estava',
  'quando',
  'muito',
  'já',
  'só',
  'até',
  'isso',
  'isto',
  'esse',
  'essa',
  'esses',
  'essas',
  'este',
  'esta',
  'estes',
  'estas',
  'ele',
  'ela',
  'eles',
  'elas',
  'eu',
  'você',
  'meu',
  'minha',
  'seu',
  'sua',
  'nosso',
  'nossa',
  'entre',
  'depois',
  'antes',
  'também',
  'sobre',
  'todo',
  'toda',
  'todos',
  'todas',
  'consigo',
  'consegue',
  'está',
  'estão',
  'sempre',
  'nunca',
  'ainda',
]);

const TAMANHO_MINIMO_PALAVRA = 3;

// Extrai o conjunto de palavras "significativas" de um texto: minúsculas,
// sem pontuação, sem palavras muito curtas ou muito comuns.
export function extrairPalavrasChave(texto: string): Set<string> {
  const palavras = texto
    .toLowerCase()
    // \p{L}/\p{N} (Unicode) em vez de [a-z0-9] pra não quebrar acentos —
    // troca qualquer coisa que não seja letra/número por espaço.
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(
      (palavra) =>
        palavra.length >= TAMANHO_MINIMO_PALAVRA &&
        !PALAVRAS_IGNORADAS.has(palavra),
    );

  return new Set(palavras);
}

// Quantidade de palavras que aparecem nos dois conjuntos — é essa
// contagem que vira a "pontuação" de semelhança entre dois chamados.
export function contarPalavrasEmComum(a: Set<string>, b: Set<string>): number {
  let total = 0;
  for (const palavra of a) {
    if (b.has(palavra)) total++;
  }
  return total;
}
