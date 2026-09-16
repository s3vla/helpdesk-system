import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarForumSugestoes1789126951150 implements MigrationInterface {
  name = 'CriarForumSugestoes1789126951150';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sugestao_forum_status_enum" AS ENUM('ABERTA', 'EM_ANALISE', 'IMPLEMENTADA', 'RECUSADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sugestao_forum" ("id" SERIAL NOT NULL, "titulo" character varying NOT NULL, "mensagem" text NOT NULL, "status" "public"."sugestao_forum_status_enum" NOT NULL DEFAULT 'ABERTA', "criadaEm" TIMESTAMP NOT NULL DEFAULT now(), "autorId" integer NOT NULL, CONSTRAINT "PK_af669aad89f5025ff402b3d7341" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comentario_forum" ("id" SERIAL NOT NULL, "mensagem" text NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), "sugestaoId" integer NOT NULL, "autorId" integer NOT NULL, CONSTRAINT "PK_22846df4ddbf6fe01f117425682" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sugestao_forum" ADD CONSTRAINT "FK_b26a5e658caad8a9072c9ea098f" FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentario_forum" ADD CONSTRAINT "FK_bf9f9823cb62b5dbf7c9aa56756" FOREIGN KEY ("sugestaoId") REFERENCES "sugestao_forum"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentario_forum" ADD CONSTRAINT "FK_e4af66555ed8485a17eda4c5c87" FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comentario_forum" DROP CONSTRAINT "FK_e4af66555ed8485a17eda4c5c87"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentario_forum" DROP CONSTRAINT "FK_bf9f9823cb62b5dbf7c9aa56756"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sugestao_forum" DROP CONSTRAINT "FK_b26a5e658caad8a9072c9ea098f"`,
    );
    await queryRunner.query(`DROP TABLE "comentario_forum"`);
    await queryRunner.query(`DROP TABLE "sugestao_forum"`);
    await queryRunner.query(`DROP TYPE "public"."sugestao_forum_status_enum"`);
  }
}
