import { MigrationInterface, QueryRunner } from 'typeorm';

// Comentario.imagemUrl (texto único, nullable) vira imagensUrls (array via
// simple-json, mesmo padrão de Chamado.imagensUrls/SolucaoConhecida.
// imagensUrls) — backfill: quem já tinha uma imagem vira array de 1
// elemento; quem não tinha vira array vazio. down() é o reverso, mas só
// recupera o PRIMEIRO elemento do array — um comentário que ganhar mais de
// uma imagem antes de um eventual rollback perde as extras nesse cenário
// (aceito: rollback de uma feature nova descartando dado que só existe
// PORQUE a feature existia é o comportamento esperado, não um bug).
export class AdicionarImagensMultiplasComentario1789578576696 implements MigrationInterface {
  name = 'AdicionarImagensMultiplasComentario1789578576696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comentario" ADD "imagensUrls" text NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `UPDATE "comentario" SET "imagensUrls" = json_build_array("imagemUrl")::text WHERE "imagemUrl" IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "comentario" DROP COLUMN "imagemUrl"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comentario" ADD "imagemUrl" text`);
    await queryRunner.query(`
      UPDATE "comentario"
      SET "imagemUrl" = ("imagensUrls"::jsonb->>0)
      WHERE jsonb_array_length("imagensUrls"::jsonb) > 0
    `);
    await queryRunner.query(
      `ALTER TABLE "comentario" DROP COLUMN "imagensUrls"`,
    );
  }
}
