import { MigrationInterface, QueryRunner } from 'typeorm';

// Migração de maior risco do projeto até agora: troca CategoriaChamado (enum
// fixo em código) por uma tabela "categoria" administrável pelo técnico —
// PRECISA preservar a categoria de TODO chamado e solução conhecida já
// existentes, sem perder nenhum. Estratégia (bem mais cautelosa que o que
// `migration:generate` teria produzido sozinho — aquele fazia RENAME +
// DROP COLUMN + ADD COLUMN NOT NULL sem nenhum backfill, o que teria
// APAGADO a categoria de toda linha existente):
//   1. Cria "categoria" e semeia as 5 categorias que o enum antigo já tinha.
//   2. RENOMEIA a coluna enum antiga pra "categoriaLegado" (preserva o valor
//      — nunca é apagada até o backfill estar confirmado).
//   3. Adiciona "categoriaId" NULLABLE (ainda sem NOT NULL, pra não travar
//      antes do backfill).
//   4. Backfill explícito, linha por linha, mapeando o texto do enum pro id
//      da categoria correspondente (HARDWARE -> Hardware, etc.) — mapeamento
//      fechado e explícito, sem adivinhação nem fuzzy-match.
//   5. SÓ ENTÃO define "categoriaId" NOT NULL — se o backfill deixou
//      QUALQUER linha sem match (não deveria, o mapeamento cobre os 5
//      valores do enum inteiro), o Postgres recusa o NOT NULL e a migração
//      inteira falha/reverte, em vez de silenciosamente aceitar uma linha
//      órfã.
//   6. Adiciona as FKs, dropa a coluna legado e os tipos enum antigos.
export class CriarCategorias1789384586624 implements MigrationInterface {
  name = 'CriarCategorias1789384586624';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tabela + seed — os 5 nomes batem com o que o frontend (utils/
    // categorias.js) e os e-mails (email.service.ts) já mostravam como
    // rótulo pro enum antigo, então a mudança é invisível pra quem usa o
    // sistema. "Rede" é a única com consideradaRede=true (ver
    // nivel-triagem.util.ts).
    await queryRunner.query(
      `CREATE TABLE "categoria" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, "ativo" boolean NOT NULL DEFAULT true, "consideradaRede" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_0a9942514087463668e9638bf90" UNIQUE ("nome"), CONSTRAINT "PK_f027836b77b84fb4c3a374dc70d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`
      INSERT INTO "categoria" ("nome", "consideradaRede") VALUES
        ('Hardware', false),
        ('Software', false),
        ('Rede', true),
        ('Acesso', false),
        ('Outro', false)
    `);

    // 2 + 3. Preserva o valor antigo, abre espaço pro novo.
    await queryRunner.query(
      `ALTER TABLE "chamado" RENAME COLUMN "categoria" TO "categoriaLegado"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" RENAME COLUMN "categoria" TO "categoriaLegado"`,
    );
    await queryRunner.query(`ALTER TABLE "chamado" ADD "categoriaId" integer`);
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" ADD "categoriaId" integer`,
    );

    // 4. Backfill — mapeamento fechado, 1 UPDATE por valor do enum antigo,
    // nas duas tabelas.
    const mapaEnumParaNome: Record<string, string> = {
      HARDWARE: 'Hardware',
      SOFTWARE: 'Software',
      REDE: 'Rede',
      ACESSO: 'Acesso',
      OUTRO: 'Outro',
    };
    for (const [valorEnum, nomeCategoria] of Object.entries(mapaEnumParaNome)) {
      await queryRunner.query(
        `UPDATE "chamado" SET "categoriaId" = (SELECT id FROM "categoria" WHERE nome = $1) WHERE "categoriaLegado"::text = $2`,
        [nomeCategoria, valorEnum],
      );
      await queryRunner.query(
        `UPDATE "solucao_conhecida" SET "categoriaId" = (SELECT id FROM "categoria" WHERE nome = $1) WHERE "categoriaLegado"::text = $2`,
        [nomeCategoria, valorEnum],
      );
    }

    // 5. Trava NOT NULL — falha aqui, de propósito, se sobrou alguma linha
    // sem match no backfill acima.
    await queryRunner.query(
      `ALTER TABLE "chamado" ALTER COLUMN "categoriaId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" ALTER COLUMN "categoriaId" SET NOT NULL`,
    );

    // 6. FKs + limpeza do que não é mais necessário.
    await queryRunner.query(
      `ALTER TABLE "chamado" ADD CONSTRAINT "FK_de9d8076565a8cf0f80bdf686b9" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" ADD CONSTRAINT "FK_82b74dc6a36d62fa77c470a7dbb" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" DROP COLUMN "categoriaLegado"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" DROP COLUMN "categoriaLegado"`,
    );
    await queryRunner.query(`DROP TYPE "public"."chamado_categoria_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."solucao_conhecida_categoria_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."chamado_categoria_enum" AS ENUM('HARDWARE', 'SOFTWARE', 'REDE', 'ACESSO', 'OUTRO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solucao_conhecida_categoria_enum" AS ENUM('HARDWARE', 'SOFTWARE', 'REDE', 'ACESSO', 'OUTRO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" ADD "categoriaLegado" "public"."chamado_categoria_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" ADD "categoriaLegado" "public"."solucao_conhecida_categoria_enum"`,
    );

    const mapaNomeParaEnum: Record<string, string> = {
      Hardware: 'HARDWARE',
      Software: 'SOFTWARE',
      Rede: 'REDE',
      Acesso: 'ACESSO',
      Outro: 'OUTRO',
    };
    for (const [nomeCategoria, valorEnum] of Object.entries(mapaNomeParaEnum)) {
      await queryRunner.query(
        `UPDATE "chamado" SET "categoriaLegado" = $1::"public"."chamado_categoria_enum" WHERE "categoriaId" = (SELECT id FROM "categoria" WHERE nome = $2)`,
        [valorEnum, nomeCategoria],
      );
      await queryRunner.query(
        `UPDATE "solucao_conhecida" SET "categoriaLegado" = $1::"public"."solucao_conhecida_categoria_enum" WHERE "categoriaId" = (SELECT id FROM "categoria" WHERE nome = $2)`,
        [valorEnum, nomeCategoria],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "chamado" ALTER COLUMN "categoriaLegado" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" ALTER COLUMN "categoriaLegado" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "chamado" DROP CONSTRAINT "FK_de9d8076565a8cf0f80bdf686b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" DROP CONSTRAINT "FK_82b74dc6a36d62fa77c470a7dbb"`,
    );
    await queryRunner.query(`ALTER TABLE "chamado" DROP COLUMN "categoriaId"`);
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" DROP COLUMN "categoriaId"`,
    );
    await queryRunner.query(`DROP TABLE "categoria"`);

    await queryRunner.query(
      `ALTER TABLE "chamado" RENAME COLUMN "categoriaLegado" TO "categoria"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" RENAME COLUMN "categoriaLegado" TO "categoria"`,
    );
  }
}
