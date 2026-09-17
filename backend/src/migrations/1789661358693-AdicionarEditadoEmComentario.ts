import { MigrationInterface, QueryRunner } from 'typeorm';

// Suporte a "editar comentário" (PATCH /comentarios/:id) — null significa
// "nunca editado"; preenchido só no momento da edição (ver
// ComentariosService.editar). Não guarda o texto anterior, só o fato +
// quando, usado pro frontend mostrar "(editado)" no histórico.
export class AdicionarEditadoEmComentario1789661358693
  implements MigrationInterface
{
  name = 'AdicionarEditadoEmComentario1789661358693';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comentario" ADD "editadoEm" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comentario" DROP COLUMN "editadoEm"`);
  }
}
