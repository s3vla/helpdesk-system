// Script AVULSO — não é uma migration do TypeORM, não roda no fluxo
// normal de deploy nem é referenciado em nenhum outro lugar do código.
// Existe só pra rodar UMA VEZ, manualmente, num banco que já tem
// tarefa/anotacao com dado em texto puro, DEPOIS que o código com o
// transformer de criptografia (campo-criptografado.transformer.ts) já
// foi commitado — mas ANTES de colocar esse código pra atender tráfego
// de verdade (ver a seção "Sequência especial de deploy" em
// DEPLOY-NSSM.md, senão as leituras normais da API vão começar a falhar
// pra qualquer linha ainda em texto puro assim que o código novo subir).
//
// Uso: DATABASE_URL=... npm run criptografar:migrar   (dev, via ts-node)
//   ou DATABASE_URL=... npm run criptografar:migrar:prod   (compilado, sem ts-node)
//
// Fica dentro de src/scripts/ (não backend/scripts/ solto) só por um
// motivo técnico: nest-cli/tsc infere o rootDir da compilação a partir do
// ancestral comum de TODO .ts incluído — um arquivo fora de src/ vira
// irmão de src/ nesse cálculo, e o build inteiro passa a sair como
// dist/src/main.js em vez de dist/main.js, quebrando IIS/NSSM/uploads/
// ServeStaticModule (todos esperam dist/main.js na raiz). Vale a pena
// nunca criar um .ts solto fora de src/ neste projeto por causa disso.
//
// Deliberadamente NÃO usa o Repository/Entity do TypeORM pra ler os
// dados — se usasse, o transformer tentaria DESCRIPTOGRAFAR um valor que
// ainda está em texto puro e lançaria na hora. Em vez disso, lê e escreve
// via SQL bruto (AppDataSource.query), chamando criptografar()/
// descriptografar() manualmente — a mesma função que o transformer usa
// por baixo, só que acionada por nós, no momento certo.
import { AppDataSource } from '../data-source';
import {
  criptografar,
  descriptografar,
} from '../common/transformers/campo-criptografado.transformer';

// Tenta descriptografar com a CHAVE ATUAL — se conseguir, o valor já está
// criptografado (idempotência: rodar o script duas vezes não criptografa
// de novo por cima, o que corromperia o dado). Se falhar (não é
// base64+IV+tag válido pra essa chave), assume texto puro e criptografa.
// Isso é seguro de verdade, não só "provavelmente": GCM tem probabilidade
// de falso positivo de forjar uma tag válida por acaso de ~2^-128 — não
// existe risco prático de um texto puro comum "passar" como já
// criptografado.
function jaEstaCriptografado(valor: string): boolean {
  try {
    descriptografar(valor);
    return true;
  } catch {
    return false;
  }
}

async function migrarTabela(
  tabela: 'tarefa' | 'anotacao',
  colunas: string[],
): Promise<void> {
  const linhas: Array<Record<string, string | null> & { id: number }> =
    await AppDataSource.query(
      `SELECT id, ${colunas.join(', ')} FROM "${tabela}"`,
    );

  let atualizadas = 0;
  let jaCriptografadas = 0;

  for (const linha of linhas) {
    const valoresNovos: Record<string, string | null> = {};
    let precisaAtualizar = false;

    for (const coluna of colunas) {
      const valorAtual = linha[coluna];
      if (valorAtual == null) {
        valoresNovos[coluna] = null;
        continue;
      }
      if (jaEstaCriptografado(valorAtual)) {
        valoresNovos[coluna] = valorAtual;
        continue;
      }
      valoresNovos[coluna] = criptografar(valorAtual);
      precisaAtualizar = true;
    }

    if (!precisaAtualizar) {
      jaCriptografadas++;
      continue;
    }

    const setClause = colunas.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
    const parametros = [...colunas.map((c) => valoresNovos[c]), linha.id];
    await AppDataSource.query(
      `UPDATE "${tabela}" SET ${setClause} WHERE id = $${colunas.length + 1}`,
      parametros,
    );
    atualizadas++;
  }

  console.log(
    `${tabela}: ${linhas.length} linha(s) no total — ${atualizadas} criptografada(s) agora, ${jaCriptografadas} já estavam.`,
  );
}

async function main() {
  await AppDataSource.initialize();
  console.log('Conectado. Iniciando migração de dado existente...\n');

  await migrarTabela('tarefa', ['titulo', 'descricao']);
  await migrarTabela('anotacao', ['conteudo']);

  console.log(
    '\nConcluído. Confirme lendo um registro pela API antes de considerar terminado.',
  );
  await AppDataSource.destroy();
}

main().catch((erro: unknown) => {
  console.error('Falha na migração:', erro);
  process.exit(1);
});
