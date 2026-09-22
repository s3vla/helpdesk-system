import { Categoria } from '../categorias/entities/categoria.entity';
import { NivelChamado } from '../common/enums/nivel-chamado.enum';

// Faixa Unicode dos acentos "soltos" que sobram depois de normalize('NFD')
// separar uma letra acentuada em base + marca (ex: 'í' -> 'i' + marca de
// acento agudo). Filtrar por código, em vez de um literal de regex com os
// caracteres de acento escritos diretamente no arquivo, evita esses
// caracteres invisíveis/combináveis aparecerem quebrados num editor comum.
const CODIGO_INICIO_MARCA_ACENTO = 0x0300;
const CODIGO_FIM_MARCA_ACENTO = 0x036f;

// Remove acentos (á -> a, í -> i...) e baixa a caixa, pra "domínio" e
// "dominio" — ou "SERVIDOR" e "servidor" — serem tratados como o mesmo termo.
function normalizar(texto: string): string {
  return Array.from(texto.toLowerCase().normalize('NFD'))
    .filter((caractere) => {
      const codigo = caractere.codePointAt(0)!;
      return (
        codigo < CODIGO_INICIO_MARCA_ACENTO || codigo > CODIGO_FIM_MARCA_ACENTO
      );
    })
    .join('');
}

function contemAlgumTermo(textoNormalizado: string, termos: string[]): boolean {
  return termos.some((termo) => textoNormalizado.includes(termo));
}

// Regra de triagem automática de nível — checada nesta ordem (ver
// CONTRATO.md):
//   1. Texto contém alguma palavra do dicionário PalavraChaveN3 ativa -> N3
//   2. Qualquer outro caso                                            -> categoria.nivelPadrao
// Palavra-chave sempre sobrepõe a categoria, nunca o contrário — um chamado
// numa categoria N1 que menciona "erpxyz" (o ERP principal, ver seed de
// PalavraChaveN3) ainda vai pra N3. Sem IA de
// propósito — é busca de termo simples, do mesmo jeito que a comparação de
// soluções parecidas (ver solucoes-conhecidas/palavras-chave.util.ts).
// Esse nível é só uma categorização/filtro pro técnico se organizar — NÃO é
// controle de acesso: os dois técnicos continuam vendo e podendo assumir
// qualquer chamado, seja qual for o nível calculado aqui.
//
// `palavrasChaveN3` já vem filtrada por ativo=true (ver
// PalavrasChaveN3Service.listarAtivas, chamado por ChamadosService antes de
// calcular o nível) — este util não sabe nada sobre banco de dados.
export function calcularNivelSugerido(
  categoria: Categoria,
  descricao: string,
  mensagemErro: string | null,
  palavrasChaveN3: string[],
): NivelChamado {
  const textoCombinado = normalizar(`${descricao} ${mensagemErro ?? ''}`);
  const termosNormalizados = palavrasChaveN3.map(normalizar);

  if (contemAlgumTermo(textoCombinado, termosNormalizados)) {
    return NivelChamado.N3;
  }
  return categoria.nivelPadrao;
}
