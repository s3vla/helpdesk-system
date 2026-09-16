import { MigrationInterface, QueryRunner } from 'typeorm';

// destinatarioTipo NOT NULL com DEFAULT 'TODOS' — o Postgres já backfilla
// todo aviso existente com esse valor no mesmo ALTER, sem passo separado:
// comportamento de hoje (todo aviso visível pra todo colaborador) vira
// exatamente o caso TODOS, sem mudar nada pra quem já foi publicado.
// grupoId/usuarioId nullable, sem backfill — só passam a existir daqui pra
// frente, quando um aviso for criado com escopo GRUPO/USUARIO.
export class AdicionarDestinatarioAviso1789559408729 implements MigrationInterface {
  name = 'AdicionarDestinatarioAviso1789559408729';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."aviso_destinatariotipo_enum" AS ENUM('TODOS', 'GRUPO', 'USUARIO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso" ADD "destinatarioTipo" "public"."aviso_destinatariotipo_enum" NOT NULL DEFAULT 'TODOS'`,
    );
    await queryRunner.query(`ALTER TABLE "aviso" ADD "grupoId" integer`);
    await queryRunner.query(`ALTER TABLE "aviso" ADD "usuarioId" integer`);
    await queryRunner.query(
      `ALTER TABLE "aviso" ADD CONSTRAINT "FK_aviso_grupoId" FOREIGN KEY ("grupoId") REFERENCES "grupo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso" ADD CONSTRAINT "FK_aviso_usuarioId" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aviso" DROP CONSTRAINT "FK_aviso_usuarioId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso" DROP CONSTRAINT "FK_aviso_grupoId"`,
    );
    await queryRunner.query(`ALTER TABLE "aviso" DROP COLUMN "usuarioId"`);
    await queryRunner.query(`ALTER TABLE "aviso" DROP COLUMN "grupoId"`);
    await queryRunner.query(
      `ALTER TABLE "aviso" DROP COLUMN "destinatarioTipo"`,
    );
    await queryRunner.query(`DROP TYPE "public"."aviso_destinatariotipo_enum"`);
  }
}
