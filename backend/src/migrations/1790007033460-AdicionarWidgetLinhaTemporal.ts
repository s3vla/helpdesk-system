import { MigrationInterface, QueryRunner } from 'typeorm';

// Suporte ao novo tipo de widget "Chamados por dia" (gráfico de linha,
// série temporal abertos vs finalizados) — FormatoVisualWidget ganha
// LINHA, e um widget desse tipo não tem "o que agrupar" nem "contagem vs
// ranking" (sempre é uma contagem diária fixa, ver
// ChamadosService.obterMetricasDiarias), por isso tipo/agruparPor passam
// a nullable.
export class AdicionarWidgetLinhaTemporal1790007033460
  implements MigrationInterface
{
  name = 'AdicionarWidgetLinhaTemporal1790007033460';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Recria o enum em vez de ALTER TYPE ... ADD VALUE — precisa rodar
    // fora de transação em versões antigas do Postgres, então evitamos
    // depender disso dentro de uma migration do TypeORM (que roda em
    // transação por padrão).
    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "formatoVisual" TYPE character varying`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."dashboard_widget_formatovisual_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dashboard_widget_formatovisual_enum" AS ENUM('barra', 'pizza', 'lista', 'linha')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "formatoVisual" TYPE "public"."dashboard_widget_formatovisual_enum" USING "formatoVisual"::"public"."dashboard_widget_formatovisual_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "tipo" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "agruparPor" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "agruparPor" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "tipo" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "formatoVisual" TYPE character varying`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."dashboard_widget_formatovisual_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dashboard_widget_formatovisual_enum" AS ENUM('barra', 'pizza', 'lista')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dashboard_widget" ALTER COLUMN "formatoVisual" TYPE "public"."dashboard_widget_formatovisual_enum" USING "formatoVisual"::"public"."dashboard_widget_formatovisual_enum"`,
    );
  }
}
