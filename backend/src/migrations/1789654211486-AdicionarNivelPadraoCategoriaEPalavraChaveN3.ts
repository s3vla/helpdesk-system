import { MigrationInterface, QueryRunner } from 'typeorm';

// Duas mudanças relacionadas na triagem automática de nível:
// 1. Categoria.consideradaRede (boolean, só cobria N2) vira
//    Categoria.nivelPadrao (enum N1/N2/N3) — cada categoria pode ser
//    configurada pra qualquer um dos três níveis, não só "é rede ou não".
//    Categorias com consideradaRede=true migram pra nivelPadrao='N2',
//    preservando o comportamento atual; as demais viram 'N1' (já era o
//    comportamento padrão).
// 2. Nova tabela palavra_chave_n3 — dicionário administrável que substitui
//    os dois arrays hardcoded que existiam em nivel-triagem.util.ts
//    (TERMOS_N3_VIASOFT, TERMOS_N3_INFRAESTRUTURA). Seed com os mesmos 9
//    termos que já estavam em código, pra não mudar nenhum comportamento
//    de triagem existente no momento em que esta migration roda.
export class AdicionarNivelPadraoCategoriaEPalavraChaveN31789654211486
  implements MigrationInterface
{
  name = 'AdicionarNivelPadraoCategoriaEPalavraChaveN31789654211486';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."categoria_nivelpadrao_enum" AS ENUM('N1', 'N2', 'N3')`,
    );
    await queryRunner.query(
      `ALTER TABLE "categoria" ADD "nivelPadrao" "public"."categoria_nivelpadrao_enum" NOT NULL DEFAULT 'N1'`,
    );
    await queryRunner.query(
      `UPDATE "categoria" SET "nivelPadrao" = 'N2' WHERE "consideradaRede" = true`,
    );
    await queryRunner.query(`ALTER TABLE "categoria" DROP COLUMN "consideradaRede"`);

    await queryRunner.query(`
      CREATE TABLE "palavra_chave_n3" (
        "id" SERIAL NOT NULL,
        "palavra" character varying NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_palavra_chave_n3_palavra" UNIQUE ("palavra"),
        CONSTRAINT "PK_palavra_chave_n3" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "palavra_chave_n3" ("palavra") VALUES
        ('viasoft'), ('via soft'), ('sistema viasoft'), ('sistema da empresa'),
        ('servidor'), ('banco de dados'), ('backup'), ('firewall'), ('dominio')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "palavra_chave_n3"`);

    await queryRunner.query(
      `ALTER TABLE "categoria" ADD "consideradaRede" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "categoria" SET "consideradaRede" = true WHERE "nivelPadrao" = 'N2'`,
    );
    await queryRunner.query(`ALTER TABLE "categoria" DROP COLUMN "nivelPadrao"`);
    await queryRunner.query(`DROP TYPE "public"."categoria_nivelpadrao_enum"`);
  }
}
