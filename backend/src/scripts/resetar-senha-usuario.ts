// Script AVULSO — corrige o caso "SeedService já rodou antes com uma senha
// diferente da que está hoje na variável de ambiente" (ver seed.service.ts:
// o seed é idempotente por E-MAIL, não por senha — se o usuário já existe,
// ele sai sem tocar em nada, então mudar SEED_TECNICO_N_SENHA depois não
// atualiza uma conta já criada).
//
// Faz UPDATE direto (senhaHash + deveTrocarSenha) num usuário que JÁ
// existe — nunca cria. Se o e-mail não for encontrado, aborta sem
// alterar nada.
//
// deveTrocarSenha é setado pra `false` de propósito (diferente do que o
// SeedService faz na criação normal, que sempre deixa `true`): isso aqui é
// pensado pro cenário de ambiente de demo público, onde a credencial
// documentada (ex: README, seção "Demo ao vivo") precisa continuar
// funcionando igual pra QUALQUER visitante — se ficasse `true`, a primeira
// pessoa a logar seria forçada a trocar a senha, e a partir daí a senha
// pública documentada pararia de funcionar pra todo mundo depois dela.
//
// Uso: npx ts-node src/scripts/resetar-senha-usuario.ts <email> <novaSenha>
// (rodar com o DATABASE_URL do ambiente-alvo carregado no .env local —
// nunca commitar esse .env apontando pra produção)
//
// dotenv carregado aqui EXPLICITAMENTE, por caminho absoluto (via
// __dirname), em vez de depender só do `import 'dotenv/config'` de
// data-source.ts — aquele carrega a partir de process.cwd(), então rodar
// o comando de um diretório diferente de backend/ (ex: da raiz do repo)
// faz o .env não ser encontrado, DATABASE_URL fica undefined, e o `pg`
// falha com o erro genérico "client password must be a string" em vez de
// avisar claramente qual variável está faltando.
import { config as carregarDotenv } from 'dotenv';
import { join } from 'node:path';
carregarDotenv({ path: join(__dirname, '..', '..', '.env') });

import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';

const CUSTO_BCRYPT = 12; // mesmo custo usado em seed.service.ts

async function main() {
  const [email, novaSenha] = process.argv.slice(2);
  if (!email || !novaSenha) {
    console.error(
      'Uso: npx ts-node src/scripts/resetar-senha-usuario.ts <email> <novaSenha>',
    );
    process.exit(1);
  }

  // Preflight explícito — sem isso, DATABASE_URL ausente derruba o script
  // lá dentro do driver `pg` com "client password must be a string", um
  // erro que não aponta pra causa real (variável não carregada).
  if (!process.env.DATABASE_URL) {
    console.error(
      'DATABASE_URL não está definida. Confirme que backend/.env existe e ' +
        'tem essa variável apontando pro banco-alvo (local de teste ou Neon).',
    );
    process.exit(1);
  }

  await AppDataSource.initialize();
  try {
    const repositorio = AppDataSource.getRepository(Usuario);
    const usuario = await repositorio.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!usuario) {
      console.error(
        `Nenhum usuário encontrado com o e-mail "${email}" — nada foi alterado.`,
      );
      process.exit(1);
    }

    usuario.senhaHash = await bcrypt.hash(novaSenha, CUSTO_BCRYPT);
    usuario.deveTrocarSenha = false;
    await repositorio.save(usuario);

    // Nunca loga a senha em texto puro, mesmo sendo uma senha de demo já
    // pública no README — hábito de não imprimir segredo em log, sem
    // exceção.
    console.log(
      `Senha atualizada para "${usuario.email}" (id ${usuario.id}). deveTrocarSenha = false.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((erro: unknown) => {
  console.error('Falha ao resetar senha:', erro);
  process.exit(1);
});
