import { CategoriaChamado } from '../common/enums/categoria-chamado.enum';
import { NivelChamado } from '../common/enums/nivel-chamado.enum';

// Menção ao ERP principal da empresa — sempre N3, não importa a categoria,
// porque o Viasoft parado afeta a operação inteira. Cobre as variações mais
// comuns de escrita ("viasoft erp" já cai na primeira, por conter
// "viasoft" como substring).
const TERMOS_N3_VIASOFT = ['viasoft', 'via soft'];

// Termos de infraestrutura compartilhada — também sempre N3, pelo mesmo
// motivo: tende a afetar mais gente que um problema isolado numa máquina.
// "dominio" já cobre "domínio" porque o texto é normalizado (acentos
// removidos) antes da comparação.
const TERMOS_N3_INFRAESTRUTURA = [
  'servidor',
  'banco de dados',
  'backup',
  'firewall',
  'dominio',
];

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

// Regra de triagem automática de nível — checada nesta ordem, a primeira
// que bater define o nível (ver CONTRATO.md):
//   1. Menção ao Viasoft (ERP principal)                  -> N3
//   2. Menção a infraestrutura crítica (servidor, backup...) -> N3
//   3. Categoria REDE                                      -> N2
//   4. Qualquer outro caso                                 -> N1
// Sem IA de propósito — é busca de termo simples, do mesmo jeito que a
// comparação de soluções parecidas (ver solucoes-conhecidas/palavras-chave.util.ts).
// Esse nível é só uma categorização/filtro pro técnico se organizar — NÃO é
// controle de acesso: os dois técnicos continuam vendo e podendo assumir
// qualquer chamado, seja qual for o nível calculado aqui.
export function calcularNivelSugerido(
  categoria: CategoriaChamado,
  descricao: string,
  mensagemErro: string | null,
): NivelChamado {
  const textoCombinado = normalizar(`${descricao} ${mensagemErro ?? ''}`);

  if (contemAlgumTermo(textoCombinado, TERMOS_N3_VIASOFT)) {
    return NivelChamado.N3;
  }
  if (contemAlgumTermo(textoCombinado, TERMOS_N3_INFRAESTRUTURA)) {
    return NivelChamado.N3;
  }
  if (categoria === CategoriaChamado.REDE) {
    return NivelChamado.N2;
  }
  return NivelChamado.N1;
}
