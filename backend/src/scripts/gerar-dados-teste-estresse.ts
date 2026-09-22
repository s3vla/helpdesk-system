// Script AVULSO — gera uma massa grande de dado fictício (chamados,
// tarefas, anotações, avisos, sugestões do fórum) presa a UMA conta de
// teste só (EMAIL_TESTE abaixo), pra teste de estresse visual manual. Não
// roda no fluxo normal de deploy, não é referenciado em nenhum outro lugar
// do código. Uso: npx ts-node src/scripts/gerar-dados-teste-estresse.ts —
// depois de terminar a inspeção visual, rode
// remover-dados-teste-estresse.ts pra apagar tudo de novo (mesmo
// EMAIL_TESTE, mesmo critério de seleção).
//
// Fica em src/scripts/ (não backend/scripts/ solto) pelo mesmo motivo já
// documentado em criptografar-dados-existentes.ts: um .ts fora de src/
// muda o rootDir que o nest-cli/tsc infere e quebra dist/main.js.
//
// Usa o Repository do TypeORM (não SQL bruto) de propósito — diferente do
// script de migração de criptografia, aqui os dados são NOVOS (nunca
// existiu texto puro pra confundir o transformer), então
// campoCriptografado.to() cuida da criptografia de Tarefa/Anotacao
// automaticamente, sem esforço extra aqui.
//
// Todo autor/dono de todo registro criado aqui é SEMPRE o usuário de
// teste (mesmo avisos e comentários do fórum, que na API real só técnico
// cria — aqui não passamos pela API/RolesGuard, é acesso direto ao banco,
// então tecnicamente permitido; a única coisa que importa pra este script
// é que TUDO fique preso a um autor só, pra remover-dados-teste-estresse.ts
// conseguir apagar com um critério simples e seguro: "tudo que pertence a
// este e-mail").
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { Chamado } from '../chamados/entities/chamado.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { PrioridadeChamado } from '../common/enums/prioridade-chamado.enum';
import { StatusChamado } from '../common/enums/status-chamado.enum';
import { NivelChamado } from '../common/enums/nivel-chamado.enum';
import { Tarefa } from '../tarefas/entities/tarefa.entity';
import { StatusTarefa } from '../common/enums/status-tarefa.enum';
import { Anotacao } from '../anotacoes/entities/anotacao.entity';
import { Aviso } from '../avisos/entities/aviso.entity';
import { TipoAviso } from '../common/enums/tipo-aviso.enum';
import { SugestaoForum } from '../forum/entities/sugestao-forum.entity';
import { ComentarioForum } from '../forum/entities/comentario-forum.entity';

// NÃO exportado de propósito — remover-dados-teste-estresse.ts duplica
// este valor em vez de importar daqui, porque importar qualquer coisa
// deste arquivo executaria o main() dele também (chamado incondicionalmente
// no nível do módulo, ver final do arquivo), rodando os dois scripts ao
// mesmo tempo no mesmo processo.
const EMAIL_TESTE = 'estresse@empresa-exemplo.com';

const CUSTO_BCRYPT = 12;

const PRIORIDADES = Object.values(PrioridadeChamado);
const STATUS_CHAMADO = Object.values(StatusChamado);
const NIVEIS = Object.values(NivelChamado);
const TIPOS_AVISO = Object.values(TipoAviso);
const STATUS_TAREFA = Object.values(StatusTarefa);

function escolher<T>(lista: T[], indice: number): T {
  return lista[indice % lista.length];
}

// Stack trace fictício, só pra ter um "mensagem de erro" bem longo e com
// muita quebra de linha na massa de teste (categoria SOFTWARE costuma vir
// com isso na prática).
function gerarStackTraceFicticio(n: number): string {
  const linhas = [
    `TypeError: Cannot read properties of undefined (reading 'valor_${n}')`,
    `    at processarPedido (/app/src/modulos/pedido-${n}.js:${42 + n}:17)`,
    `    at async Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)`,
    `    at async trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)`,
    `    at async /app/node_modules/express/lib/router/index.js:286:9`,
    `    at async Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)`,
    `    at async next (/app/node_modules/express/lib/router/index.js:280:10)`,
    `    at async validarSessao (/app/src/middlewares/auth-${n}.js:${11 + n}:5)`,
    `Caused by: ConnectionError: connect ETIMEDOUT 10.0.${n % 255}.${(n * 7) % 255}:5432`,
    `    at Connection._handleConnectTimeout (/app/node_modules/pg/lib/connection.js:${100 + n})`,
  ];
  return linhas.join('\n');
}

function gerarParagrafoLongo(base: string, repeticoes: number): string {
  const paragrafos: string[] = [];
  for (let i = 0; i < repeticoes; i++) {
    paragrafos.push(
      `${base} Parágrafo ${i + 1} de teste, com bastante texto pra simular uma descrição real que alguém escreveria explicando o problema com detalhes, passos pra reproduzir, e o que já foi tentado até agora.`,
    );
  }
  return paragrafos.join('\n\n');
}

async function main() {
  await AppDataSource.initialize();
  console.log('Conectado. Gerando dado de teste de estresse...\n');

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const chamadoRepo = AppDataSource.getRepository(Chamado);
  // Categorias ativas de verdade do banco (não mais Object.values de um
  // enum fixo) — precisa rodar depois da migration CriarCategorias, senão
  // essa lista vem vazia e o script falha ao tentar criar chamado sem
  // categoria nenhuma pra escolher.
  const categorias = await AppDataSource.getRepository(Categoria).find({
    where: { ativo: true },
  });
  if (categorias.length === 0) {
    console.log('Nenhuma categoria ativa encontrada — rode a migration antes.');
    await AppDataSource.destroy();
    process.exit(1);
  }
  const tarefaRepo = AppDataSource.getRepository(Tarefa);
  const anotacaoRepo = AppDataSource.getRepository(Anotacao);
  const avisoRepo = AppDataSource.getRepository(Aviso);
  const sugestaoRepo = AppDataSource.getRepository(SugestaoForum);
  const comentarioRepo = AppDataSource.getRepository(ComentarioForum);

  const existente = await usuarioRepo.findOne({
    where: { email: EMAIL_TESTE },
  });
  if (existente) {
    console.log(
      `Já existe uma conta com ${EMAIL_TESTE} (id ${existente.id}) — rode remover-dados-teste-estresse.ts antes de gerar de novo.`,
    );
    await AppDataSource.destroy();
    process.exit(1);
  }

  const usuarioTeste = await usuarioRepo.save(
    usuarioRepo.create({
      nome: 'Conta de Teste — Estresse Visual',
      email: EMAIL_TESTE,
      senhaHash: await bcrypt.hash('TesteEstresse123!', CUSTO_BCRYPT),
      cargo: 'Conta de teste (temporária)',
      departamento: 'Teste',
      deveTrocarSenha: false,
      tipo: TipoUsuario.COLABORADOR,
    }),
  );
  console.log(
    `Usuário de teste criado: id ${usuarioTeste.id} (${EMAIL_TESTE})`,
  );

  // ---- Chamados (55) ----
  const TOTAL_CHAMADOS = 55;
  for (let i = 0; i < TOTAL_CHAMADOS; i++) {
    const categoria = escolher(categorias, i);
    let descricao: string;
    let mensagemErro: string | null = null;
    if (i % 5 === 0) {
      descricao = 'Não funciona.';
    } else if (i % 5 === 1) {
      descricao = gerarParagrafoLongo(
        `Chamado de teste de estresse #${i}: sistema apresentando comportamento inesperado.`,
        6,
      );
    } else {
      descricao = `Chamado de teste de estresse #${i}: descrição de tamanho médio, explicando o problema em uma ou duas frases.`;
    }
    if (categoria.nome === 'Software' && i % 3 === 0) {
      mensagemErro = gerarStackTraceFicticio(i);
    }
    await chamadoRepo.save(
      chamadoRepo.create({
        titulo: `[TESTE ESTRESSE] Chamado #${i + 1}`,
        descricao,
        mensagemErro,
        categoria,
        prioridade: escolher(PRIORIDADES, i + 1),
        nivel: escolher(NIVEIS, i + 2),
        status: escolher(STATUS_CHAMADO, i),
        imagensUrls: [],
        solicitante: usuarioTeste,
      }),
    );
  }
  console.log(`${TOTAL_CHAMADOS} chamados criados.`);

  // ---- Tarefas (36, 12 em cada coluna do Kanban) ----
  const TOTAL_TAREFAS = 36;
  for (let i = 0; i < TOTAL_TAREFAS; i++) {
    const titulo =
      i % 4 === 0
        ? `Tarefa ${i + 1}`
        : `Tarefa de teste de estresse #${i + 1} — título propositalmente bem mais longo, pra ver se o card do Kanban lida bem com quebra de linha e não estica a coluna inteira`;
    const descricao =
      i % 3 === 0
        ? null
        : i % 3 === 1
          ? `Descrição curta da tarefa ${i + 1}.`
          : gerarParagrafoLongo(
              `Detalhamento da tarefa de teste #${i + 1}.`,
              3,
            );
    await tarefaRepo.save(
      tarefaRepo.create({
        titulo,
        descricao,
        status: escolher(STATUS_TAREFA, i),
        usuario: usuarioTeste,
      }),
    );
  }
  console.log(`${TOTAL_TAREFAS} tarefas criadas.`);

  // ---- Anotações (32) ----
  const TOTAL_ANOTACOES = 32;
  for (let i = 0; i < TOTAL_ANOTACOES; i++) {
    const conteudo =
      i % 3 === 0
        ? `Nota rápida ${i + 1}.`
        : gerarParagrafoLongo(
            `Anotação de teste de estresse #${i + 1}, bem detalhada.`,
            5,
          );
    await anotacaoRepo.save(
      anotacaoRepo.create({
        conteudo,
        usuario: usuarioTeste,
      }),
    );
  }
  console.log(`${TOTAL_ANOTACOES} anotações criadas.`);

  // ---- Avisos (24) ----
  const TOTAL_AVISOS = 24;
  for (let i = 0; i < TOTAL_AVISOS; i++) {
    const tipo = escolher(TIPOS_AVISO, i);
    await avisoRepo.save(
      avisoRepo.create({
        titulo: `[TESTE ESTRESSE] Aviso #${i + 1} (${tipo})`,
        mensagem:
          i % 4 === 0
            ? 'Mensagem curta de aviso.'
            : gerarParagrafoLongo(`Aviso de teste de estresse #${i + 1}.`, 2),
        tipo,
        fixado: i % 6 === 0,
        expiraEm: null,
        autor: usuarioTeste,
      }),
    );
  }
  console.log(`${TOTAL_AVISOS} avisos criados.`);

  // ---- Sugestões do Fórum (18), cada uma com 5 a 9 comentários ----
  const TOTAL_SUGESTOES = 18;
  let totalComentarios = 0;
  for (let i = 0; i < TOTAL_SUGESTOES; i++) {
    const sugestao = await sugestaoRepo.save(
      sugestaoRepo.create({
        titulo: `[TESTE ESTRESSE] Sugestão #${i + 1}`,
        mensagem:
          i % 4 === 0
            ? 'Sugestão curta.'
            : gerarParagrafoLongo(
                `Sugestão de teste de estresse #${i + 1}.`,
                3,
              ),
        autor: usuarioTeste,
      }),
    );
    const totalComentariosDesta = 5 + (i % 5); // 5 a 9
    for (let c = 0; c < totalComentariosDesta; c++) {
      await comentarioRepo.save(
        comentarioRepo.create({
          mensagem:
            c % 3 === 0
              ? `Comentário curto ${c + 1}.`
              : `Comentário mais longo ${c + 1} na sugestão #${i + 1}, simulando uma discussão real acontecendo na thread, com várias pessoas respondendo e complementando a ideia original.`,
          sugestao,
          autor: usuarioTeste,
        }),
      );
      totalComentarios++;
    }
  }
  console.log(
    `${TOTAL_SUGESTOES} sugestões criadas, com ${totalComentarios} comentários no total.`,
  );

  console.log(
    `\nConcluído. Conta de teste: ${EMAIL_TESTE} (id ${usuarioTeste.id}).`,
  );
  console.log(
    'Depois da inspeção visual, rode: npx ts-node src/scripts/remover-dados-teste-estresse.ts',
  );
  await AppDataSource.destroy();
}

main().catch((erro: unknown) => {
  console.error('Falha ao gerar dado de teste:', erro);
  process.exit(1);
});
