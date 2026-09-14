// Script AVULSO — não é uma migration do TypeORM, não roda no fluxo normal
// de deploy. Existe pra um técnico rodar sob demanda DEPOIS de cadastrar um
// mapeamento novo em Administração → Setores (POST /setores/mapeamentos),
// preenchendo o setorId de contas COLABORADOR que já existiam e ficaram sem
// setor por falta de mapeamento na época — sem precisar de uma migration
// nova a cada mapeamento cadastrado (a migration CriarSetores já fez esse
// mesmo backfill uma vez, no momento da criação das tabelas).
//
// Uso: DATABASE_URL=... npm run setores:preencher   (dev, via ts-node)
//
// Fica em src/scripts/ (não backend/scripts/ solto) pelo mesmo motivo dos
// outros scripts desta pasta — ver comentário em
// criptografar-dados-existentes.ts.
//
// Idempotente: só atualiza quem está com setorId IS NULL — rodar de novo
// depois que tudo já está preenchido não faz nada.
import { AppDataSource } from '../data-source';

async function main() {
  await AppDataSource.initialize();
  console.log('Conectado. Preenchendo setor por prefixo de e-mail...\n');

  const resultado: Array<{ id: number; email: string }> =
    await AppDataSource.query(`
    UPDATE "usuario"
    SET "setorId" = "mapeamento_setor_email"."setorId"
    FROM "mapeamento_setor_email"
    WHERE "usuario"."tipo" = 'COLABORADOR'
      AND "usuario"."setorId" IS NULL
      AND split_part(lower("usuario"."email"), '@', 1) = "mapeamento_setor_email"."prefixoEmail"
    RETURNING "usuario"."id", "usuario"."email"
  `);

  console.log(`${resultado.length} conta(s) atualizada(s):`);
  console.log(resultado);

  const restantes: Array<{ id: number; email: string }> =
    await AppDataSource.query(`
      SELECT id, email FROM "usuario"
      WHERE tipo = 'COLABORADOR' AND "setorId" IS NULL
      ORDER BY id
    `);
  console.log(
    `\n${restantes.length} conta(s) COLABORADOR ainda sem setor (prefixo sem mapeamento cadastrado):`,
  );
  console.log(restantes);

  await AppDataSource.destroy();
}

main().catch((erro: unknown) => {
  console.error('Falha no backfill:', erro);
  process.exit(1);
});
