import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarLogAcesso1789389381182 implements MigrationInterface {
  name = 'CriarLogAcesso1789389381182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "log_acesso" ("id" SERIAL NOT NULL, "dataHora" TIMESTAMP NOT NULL DEFAULT now(), "ipOrigem" text, "usuarioId" integer NOT NULL, CONSTRAINT "PK_9a44276e9f50556b33331372d19" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_acesso" ADD CONSTRAINT "FK_33723ab6f0e93ccd7eb1aefd2a1" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_acesso" DROP CONSTRAINT "FK_33723ab6f0e93ccd7eb1aefd2a1"`,
    );
    await queryRunner.query(`DROP TABLE "log_acesso"`);
  }
}
