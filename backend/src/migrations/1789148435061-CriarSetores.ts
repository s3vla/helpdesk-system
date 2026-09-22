import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarSetores1789148435061 implements MigrationInterface {
  name = 'CriarSetores1789148435061';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "setor" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, CONSTRAINT "UQ_0d9d3f7f072e028a5601e07a97e" UNIQUE ("nome"), CONSTRAINT "PK_3514be97057f6d3d8859297ba25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mapeamento_setor_email" ("id" SERIAL NOT NULL, "prefixoEmail" character varying NOT NULL, "setorId" integer NOT NULL, CONSTRAINT "UQ_09fc0810b74962c26d87e07457c" UNIQUE ("prefixoEmail"), CONSTRAINT "PK_5e45c06f713fd999751f91c44f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "usuario" ADD "setorId" integer`);
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD CONSTRAINT "FK_de6acb8a383199731eb6d302d4c" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mapeamento_setor_email" ADD CONSTRAINT "FK_225d5c87a4582af32e1d20d5885" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Seed a partir do antigo DEPARTAMENTO_POR_PREFIXO, que vivia
    // hardcoded em frontend/src/utils/departamentoPorEmail.js — os 16
    // setores distintos que esse mapa já continha.
    await queryRunner.query(`
            INSERT INTO "setor" ("nome") VALUES
                ('RH'), ('Crédito'), ('Financeiro'), ('Faturamento'),
                ('Controladoria'), ('Qualidade'), ('Contábil'), ('Marketing'),
                ('Fiscal'), ('Depósito'), ('Logística'), ('Recepção'),
                ('Fábrica'), ('Comercial'), ('Diretoria'), ('Gerência')
        `);

    // Mesmos 22 prefixos → setor que o arquivo hardcoded mapeava.
    await queryRunner.query(`
            INSERT INTO "mapeamento_setor_email" ("prefixoEmail", "setorId")
            SELECT prefixo, "setor"."id" FROM (VALUES
                ('rh', 'RH'),
                ('credito', 'Crédito'),
                ('financeiro', 'Financeiro'),
                ('faturamento', 'Faturamento'),
                ('faturamento02', 'Faturamento'),
                ('faturamento03', 'Faturamento'),
                ('controladoria', 'Controladoria'),
                ('qualidade', 'Qualidade'),
                ('qualidade02', 'Qualidade'),
                ('qualidade03', 'Qualidade'),
                ('contabil', 'Contábil'),
                ('marketing', 'Marketing'),
                ('fiscal', 'Fiscal'),
                ('deposito', 'Depósito'),
                ('deposito02', 'Depósito'),
                ('logistica', 'Logística'),
                ('recepcao', 'Recepção'),
                ('fabrica', 'Fábrica'),
                ('comercial', 'Comercial'),
                ('diretor1', 'Diretoria'),
                ('diretor2', 'Diretoria'),
                ('gerente1', 'Gerência')
            ) AS mapa(prefixo, nomeSetor)
            JOIN "setor" ON "setor"."nome" = mapa.nomeSetor
        `);

    // Backfill de usuario.setorId via JOIN pelo prefixo do e-mail (não
    // por comparação de texto contra o antigo usuario.departamento, que
    // era livre e às vezes divergia do rótulo — ver investigação no
    // plano aprovado). Restrito a COLABORADOR: técnicos ficam de fora do
    // sistema de Setor de propósito (ver seed.service.ts).
    await queryRunner.query(`
            UPDATE "usuario"
            SET "setorId" = "mapeamento_setor_email"."setorId"
            FROM "mapeamento_setor_email"
            WHERE "usuario"."tipo" = 'COLABORADOR'
              AND split_part(lower("usuario"."email"), '@', 1) = "mapeamento_setor_email"."prefixoEmail"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mapeamento_setor_email" DROP CONSTRAINT "FK_225d5c87a4582af32e1d20d5885"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP CONSTRAINT "FK_de6acb8a383199731eb6d302d4c"`,
    );
    await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN "setorId"`);
    await queryRunner.query(`DROP TABLE "mapeamento_setor_email"`);
    await queryRunner.query(`DROP TABLE "setor"`);
  }
}
