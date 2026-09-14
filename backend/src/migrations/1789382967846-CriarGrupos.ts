import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarGrupos1789382967846 implements MigrationInterface {
  name = 'CriarGrupos1789382967846';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "grupo" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, CONSTRAINT "UQ_c8f91fb177b0a2765651d84976c" UNIQUE ("nome"), CONSTRAINT "PK_dc8777104b615fea76db518334f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "grupo_membros" ("grupoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "PK_f2e131fa6b9608813f91f4cf0ba" PRIMARY KEY ("grupoId", "usuarioId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eaa2b7938a7d6f70be7c810b46" ON "grupo_membros"  ("grupoId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a87fff826df013b5c866a89c65" ON "grupo_membros"  ("usuarioId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "grupo_membros" ADD CONSTRAINT "FK_eaa2b7938a7d6f70be7c810b46d" FOREIGN KEY ("grupoId") REFERENCES "grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "grupo_membros" ADD CONSTRAINT "FK_a87fff826df013b5c866a89c659" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "grupo_membros" DROP CONSTRAINT "FK_a87fff826df013b5c866a89c659"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grupo_membros" DROP CONSTRAINT "FK_eaa2b7938a7d6f70be7c810b46d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a87fff826df013b5c866a89c65"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eaa2b7938a7d6f70be7c810b46"`,
    );
    await queryRunner.query(`DROP TABLE "grupo_membros"`);
    await queryRunner.query(`DROP TABLE "grupo"`);
  }
}
