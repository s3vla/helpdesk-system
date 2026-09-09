import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788953757855 implements MigrationInterface {
  name = 'InitialSchema1788953757855';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."comentario_tipo_enum" AS ENUM('COMENTARIO', 'NIVEL_AJUSTADO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "comentario" ("id" SERIAL NOT NULL, "texto" text NOT NULL, "tipo" "public"."comentario_tipo_enum" NOT NULL DEFAULT 'COMENTARIO', "interno" boolean NOT NULL DEFAULT false, "imagemUrl" text, "ehObservador" boolean NOT NULL DEFAULT false, "dataCriacao" TIMESTAMP NOT NULL DEFAULT now(), "chamadoId" integer NOT NULL, "autorId" integer NOT NULL, CONSTRAINT "PK_c9014211e5fbf491b9e3543bb19" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solucao_conhecida_categoria_enum" AS ENUM('HARDWARE', 'SOFTWARE', 'REDE', 'ACESSO', 'OUTRO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "solucao_conhecida" ("id" SERIAL NOT NULL, "comoFoiResolvido" text NOT NULL, "marcadaComo" boolean NOT NULL DEFAULT false, "categoria" "public"."solucao_conhecida_categoria_enum" NOT NULL, "imagensUrls" text NOT NULL DEFAULT '[]', "dataCriacao" TIMESTAMP NOT NULL DEFAULT now(), "chamadoId" integer NOT NULL, CONSTRAINT "REL_f176b612d6a8c1569bfc143da2" UNIQUE ("chamadoId"), CONSTRAINT "PK_c5f358c80c297b6bc83d31918b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamado_observador" ("id" SERIAL NOT NULL, "adicionadoEm" TIMESTAMP NOT NULL DEFAULT now(), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_d743ed001fa4402845118c52263" UNIQUE ("chamadoId", "usuarioId"), CONSTRAINT "PK_2645685043d8f0c3f839579dbc5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chamado_categoria_enum" AS ENUM('HARDWARE', 'SOFTWARE', 'REDE', 'ACESSO', 'OUTRO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chamado_prioridade_enum" AS ENUM('BAIXA', 'MEDIA', 'ALTA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chamado_nivel_enum" AS ENUM('N1', 'N2', 'N3')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chamado_status_enum" AS ENUM('PARADO', 'ANDAMENTO', 'FINALIZADO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chamado_aguardandorespostade_enum" AS ENUM('COLABORADOR', 'TECNICO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamado" ("id" SERIAL NOT NULL, "titulo" character varying NOT NULL, "descricao" text NOT NULL, "mensagemErro" text, "categoria" "public"."chamado_categoria_enum" NOT NULL, "prioridade" "public"."chamado_prioridade_enum" NOT NULL, "nivel" "public"."chamado_nivel_enum" NOT NULL, "status" "public"."chamado_status_enum" NOT NULL DEFAULT 'PARADO', "aguardandoRespostaDe" "public"."chamado_aguardandorespostade_enum", "imagensUrls" text NOT NULL DEFAULT '[]', "anydeskId" text, "dataAbertura" TIMESTAMP NOT NULL DEFAULT now(), "dataAtualizacao" TIMESTAMP NOT NULL DEFAULT now(), "solicitanteId" integer NOT NULL, "tecnicoResponsavelId" integer, "abertoPorTecnicoId" integer, CONSTRAINT "PK_740cb08ce9108763848629a2422" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usuario_tipo_enum" AS ENUM('COLABORADOR', 'TECNICO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuario" ("id" SERIAL NOT NULL, "nome" text, "email" character varying NOT NULL, "senhaHash" text, "cargo" text, "resetadoEm" TIMESTAMP, "deveTrocarSenha" boolean NOT NULL DEFAULT false, "departamento" character varying NOT NULL, "tipo" "public"."usuario_tipo_enum" NOT NULL, CONSTRAINT "UQ_2863682842e688ca198eb25c124" UNIQUE ("email"), CONSTRAINT "PK_a56c58e5cabaa04fb2c98d2d7e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dashboard_widget_tipo_enum" AS ENUM('contagem', 'ranking')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dashboard_widget_agruparpor_enum" AS ENUM('nivel', 'categoria', 'status', 'prioridade', 'solicitante', 'tecnicoResponsavel', 'repeticaoCategoria')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dashboard_widget_formatovisual_enum" AS ENUM('barra', 'pizza', 'lista')`,
    );
    await queryRunner.query(
      `CREATE TABLE "dashboard_widget" ("id" SERIAL NOT NULL, "titulo" character varying NOT NULL, "tipo" "public"."dashboard_widget_tipo_enum" NOT NULL, "agruparPor" "public"."dashboard_widget_agruparpor_enum" NOT NULL, "formatoVisual" "public"."dashboard_widget_formatovisual_enum" NOT NULL, "limite" integer, "ordem" integer NOT NULL, "ativo" boolean NOT NULL DEFAULT true, "fixo" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d776e45a42322c53e9167b00ead" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_auditoria_acao_enum" AS ENUM('MUDANCA_STATUS', 'REABERTURA', 'ATRIBUICAO', 'EDICAO', 'COMENTARIO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_auditoria" ("id" SERIAL NOT NULL, "acao" "public"."log_auditoria_acao_enum" NOT NULL, "descricao" text NOT NULL, "dataHora" TIMESTAMP NOT NULL DEFAULT now(), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "PK_e26d8eb1eef5936223c2a7d1762" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."aviso_tipo_enum" AS ENUM('INFORMATIVO', 'ALERTA', 'MANUTENCAO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "aviso" ("id" SERIAL NOT NULL, "titulo" character varying NOT NULL, "mensagem" text NOT NULL, "tipo" "public"."aviso_tipo_enum" NOT NULL, "fixado" boolean NOT NULL DEFAULT false, "publicadoEm" TIMESTAMP NOT NULL DEFAULT now(), "expiraEm" TIMESTAMP, "autorId" integer NOT NULL, CONSTRAINT "PK_854d6c5a909fa5ec04ebba83d18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "aviso_leitura" ("id" SERIAL NOT NULL, "lidoEm" TIMESTAMP NOT NULL DEFAULT now(), "avisoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_f73d71d58224d546e5360079b47" UNIQUE ("avisoId", "usuarioId"), CONSTRAINT "PK_bc6d47498288308858374f9f254" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tarefa_status_enum" AS ENUM('A_FAZER', 'FAZENDO', 'CONCLUIDO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tarefa" ("id" SERIAL NOT NULL, "titulo" character varying NOT NULL, "descricao" text, "status" "public"."tarefa_status_enum" NOT NULL DEFAULT 'A_FAZER', "criadaEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadaEm" TIMESTAMP NOT NULL DEFAULT now(), "usuarioId" integer NOT NULL, CONSTRAINT "PK_df7268dfad5b4b665bcee2ae8b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "anotacao" ("id" SERIAL NOT NULL, "conteudo" text NOT NULL, "criadaEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadaEm" TIMESTAMP NOT NULL DEFAULT now(), "usuarioId" integer NOT NULL, CONSTRAINT "PK_28cc47ee158388bdb806948c712" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentario" ADD CONSTRAINT "FK_30265abc5418d70517f14e0a7d4" FOREIGN KEY ("chamadoId") REFERENCES "chamado"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentario" ADD CONSTRAINT "FK_91c29f605caf6700f657703d95a" FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" ADD CONSTRAINT "FK_f176b612d6a8c1569bfc143da29" FOREIGN KEY ("chamadoId") REFERENCES "chamado"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado_observador" ADD CONSTRAINT "FK_5c0fb265cf69175111b6c717eb2" FOREIGN KEY ("chamadoId") REFERENCES "chamado"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado_observador" ADD CONSTRAINT "FK_3bc10edc420599272d97e752ad4" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" ADD CONSTRAINT "FK_37231516b7302990555dd52a811" FOREIGN KEY ("solicitanteId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" ADD CONSTRAINT "FK_6b04c20b06be651313cd9ec2f28" FOREIGN KEY ("tecnicoResponsavelId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" ADD CONSTRAINT "FK_ad9ff89280ad71a7a683fb90b37" FOREIGN KEY ("abertoPorTecnicoId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_auditoria" ADD CONSTRAINT "FK_64d16a748b86aa93cd580b5ce37" FOREIGN KEY ("chamadoId") REFERENCES "chamado"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_auditoria" ADD CONSTRAINT "FK_de8b253a1f355a0a7ed36afe751" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso" ADD CONSTRAINT "FK_568942eb982fdfcff282ed57c86" FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso_leitura" ADD CONSTRAINT "FK_62e4fe3edcb3df732017c9f768c" FOREIGN KEY ("avisoId") REFERENCES "aviso"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso_leitura" ADD CONSTRAINT "FK_27604b7d137a71e546bf4cd6fc4" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefa" ADD CONSTRAINT "FK_8552120aeb7fe1cf5c5c414e4ab" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "anotacao" ADD CONSTRAINT "FK_45828af32b6b3b135028251a2b0" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "anotacao" DROP CONSTRAINT "FK_45828af32b6b3b135028251a2b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarefa" DROP CONSTRAINT "FK_8552120aeb7fe1cf5c5c414e4ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso_leitura" DROP CONSTRAINT "FK_27604b7d137a71e546bf4cd6fc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso_leitura" DROP CONSTRAINT "FK_62e4fe3edcb3df732017c9f768c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aviso" DROP CONSTRAINT "FK_568942eb982fdfcff282ed57c86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_auditoria" DROP CONSTRAINT "FK_de8b253a1f355a0a7ed36afe751"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_auditoria" DROP CONSTRAINT "FK_64d16a748b86aa93cd580b5ce37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" DROP CONSTRAINT "FK_ad9ff89280ad71a7a683fb90b37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" DROP CONSTRAINT "FK_6b04c20b06be651313cd9ec2f28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado" DROP CONSTRAINT "FK_37231516b7302990555dd52a811"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado_observador" DROP CONSTRAINT "FK_3bc10edc420599272d97e752ad4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chamado_observador" DROP CONSTRAINT "FK_5c0fb265cf69175111b6c717eb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" DROP CONSTRAINT "FK_f176b612d6a8c1569bfc143da29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentario" DROP CONSTRAINT "FK_91c29f605caf6700f657703d95a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comentario" DROP CONSTRAINT "FK_30265abc5418d70517f14e0a7d4"`,
    );
    await queryRunner.query(`DROP TABLE "anotacao"`);
    await queryRunner.query(`DROP TABLE "tarefa"`);
    await queryRunner.query(`DROP TYPE "public"."tarefa_status_enum"`);
    await queryRunner.query(`DROP TABLE "aviso_leitura"`);
    await queryRunner.query(`DROP TABLE "aviso"`);
    await queryRunner.query(`DROP TYPE "public"."aviso_tipo_enum"`);
    await queryRunner.query(`DROP TABLE "log_auditoria"`);
    await queryRunner.query(`DROP TYPE "public"."log_auditoria_acao_enum"`);
    await queryRunner.query(`DROP TABLE "dashboard_widget"`);
    await queryRunner.query(
      `DROP TYPE "public"."dashboard_widget_formatovisual_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."dashboard_widget_agruparpor_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."dashboard_widget_tipo_enum"`);
    await queryRunner.query(`DROP TABLE "usuario"`);
    await queryRunner.query(`DROP TYPE "public"."usuario_tipo_enum"`);
    await queryRunner.query(`DROP TABLE "chamado"`);
    await queryRunner.query(
      `DROP TYPE "public"."chamado_aguardandorespostade_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."chamado_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chamado_nivel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chamado_prioridade_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chamado_categoria_enum"`);
    await queryRunner.query(`DROP TABLE "chamado_observador"`);
    await queryRunner.query(`DROP TABLE "solucao_conhecida"`);
    await queryRunner.query(
      `DROP TYPE "public"."solucao_conhecida_categoria_enum"`,
    );
    await queryRunner.query(`DROP TABLE "comentario"`);
    await queryRunner.query(`DROP TYPE "public"."comentario_tipo_enum"`);
  }
}
