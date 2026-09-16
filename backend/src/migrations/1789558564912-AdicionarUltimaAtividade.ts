import { MigrationInterface, QueryRunner } from 'typeorm';

// Coluna nova, nullable, sem backfill necessário — linhas existentes ficam
// com `ultimaAtividade` null (equivalente a "nunca visto desde que este
// campo passou a existir"), o que já é o comportamento correto: não temos
// como saber retroativamente quando cada usuário esteve ativo antes desta
// migração. Ver comentário completo no campo, em Usuario.
export class AdicionarUltimaAtividade1789558564912 implements MigrationInterface {
  name = 'AdicionarUltimaAtividade1789558564912';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" ADD "ultimaAtividade" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario" DROP COLUMN "ultimaAtividade"`,
    );
  }
}
