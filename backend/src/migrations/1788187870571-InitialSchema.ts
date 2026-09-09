import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788187870571 implements MigrationInterface {
  name = 'InitialSchema1788187870571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "comentario" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "texto" text NOT NULL, "tipo" varchar CHECK( "tipo" IN ('COMENTARIO','NIVEL_AJUSTADO') ) NOT NULL DEFAULT ('COMENTARIO'), "interno" boolean NOT NULL DEFAULT (0), "imagemUrl" text, "ehObservador" boolean NOT NULL DEFAULT (0), "dataCriacao" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "autorId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "solucao_conhecida" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "comoFoiResolvido" text NOT NULL, "marcadaComo" boolean NOT NULL DEFAULT (0), "categoria" varchar CHECK( "categoria" IN ('HARDWARE','SOFTWARE','REDE','ACESSO','OUTRO') ) NOT NULL, "imagensUrls" text NOT NULL DEFAULT ('[]'), "dataCriacao" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, CONSTRAINT "REL_f176b612d6a8c1569bfc143da2" UNIQUE ("chamadoId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamado_observador" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "adicionadoEm" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_d743ed001fa4402845118c52263" UNIQUE ("chamadoId", "usuarioId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamado" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "descricao" text NOT NULL, "mensagemErro" text, "categoria" varchar CHECK( "categoria" IN ('HARDWARE','SOFTWARE','REDE','ACESSO','OUTRO') ) NOT NULL, "prioridade" varchar CHECK( "prioridade" IN ('BAIXA','MEDIA','ALTA') ) NOT NULL, "nivel" varchar CHECK( "nivel" IN ('N1','N2','N3') ) NOT NULL, "status" varchar CHECK( "status" IN ('PARADO','ANDAMENTO','FINALIZADO') ) NOT NULL DEFAULT ('PARADO'), "aguardandoRespostaDe" varchar CHECK( "aguardandoRespostaDe" IN ('COLABORADOR','TECNICO') ), "imagensUrls" text NOT NULL DEFAULT ('[]'), "anydeskId" text, "dataAbertura" datetime NOT NULL DEFAULT (datetime('now')), "dataAtualizacao" datetime NOT NULL DEFAULT (datetime('now')), "solicitanteId" integer NOT NULL, "tecnicoResponsavelId" integer, "abertoPorTecnicoId" integer)`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuario" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nome" text, "email" varchar NOT NULL, "senhaHash" text, "cargo" text, "resetadoEm" datetime, "deveTrocarSenha" boolean NOT NULL DEFAULT (0), "departamento" varchar NOT NULL, "tipo" varchar CHECK( "tipo" IN ('COLABORADOR','TECNICO') ) NOT NULL, CONSTRAINT "UQ_2863682842e688ca198eb25c124" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dashboard_widget" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "tipo" varchar CHECK( "tipo" IN ('contagem','ranking') ) NOT NULL, "agruparPor" varchar CHECK( "agruparPor" IN ('nivel','categoria','status','prioridade','solicitante','tecnicoResponsavel','repeticaoCategoria') ) NOT NULL, "formatoVisual" varchar CHECK( "formatoVisual" IN ('barra','pizza','lista') ) NOT NULL, "limite" integer, "ordem" integer NOT NULL, "ativo" boolean NOT NULL DEFAULT (1), "fixo" boolean NOT NULL DEFAULT (0))`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_auditoria" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "acao" varchar CHECK( "acao" IN ('MUDANCA_STATUS','REABERTURA','ATRIBUICAO','EDICAO','COMENTARIO') ) NOT NULL, "descricao" text NOT NULL, "dataHora" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "aviso" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "mensagem" text NOT NULL, "tipo" varchar CHECK( "tipo" IN ('INFORMATIVO','ALERTA','MANUTENCAO') ) NOT NULL, "fixado" boolean NOT NULL DEFAULT (0), "publicadoEm" datetime NOT NULL DEFAULT (datetime('now')), "expiraEm" datetime, "autorId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "aviso_leitura" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "lidoEm" datetime NOT NULL DEFAULT (datetime('now')), "avisoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_f73d71d58224d546e5360079b47" UNIQUE ("avisoId", "usuarioId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tarefa" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "descricao" text, "status" varchar CHECK( "status" IN ('A_FAZER','FAZENDO','CONCLUIDO') ) NOT NULL DEFAULT ('A_FAZER'), "criadaEm" datetime NOT NULL DEFAULT (datetime('now')), "atualizadaEm" datetime NOT NULL DEFAULT (datetime('now')), "usuarioId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "anotacao" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conteudo" text NOT NULL, "criadaEm" datetime NOT NULL DEFAULT (datetime('now')), "atualizadaEm" datetime NOT NULL DEFAULT (datetime('now')), "usuarioId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_comentario" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "texto" text NOT NULL, "tipo" varchar CHECK( "tipo" IN ('COMENTARIO','NIVEL_AJUSTADO') ) NOT NULL DEFAULT ('COMENTARIO'), "interno" boolean NOT NULL DEFAULT (0), "imagemUrl" text, "ehObservador" boolean NOT NULL DEFAULT (0), "dataCriacao" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "autorId" integer NOT NULL, CONSTRAINT "FK_30265abc5418d70517f14e0a7d4" FOREIGN KEY ("chamadoId") REFERENCES "chamado" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_91c29f605caf6700f657703d95a" FOREIGN KEY ("autorId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_comentario"("id", "texto", "tipo", "interno", "imagemUrl", "ehObservador", "dataCriacao", "chamadoId", "autorId") SELECT "id", "texto", "tipo", "interno", "imagemUrl", "ehObservador", "dataCriacao", "chamadoId", "autorId" FROM "comentario"`,
    );
    await queryRunner.query(`DROP TABLE "comentario"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_comentario" RENAME TO "comentario"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_solucao_conhecida" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "comoFoiResolvido" text NOT NULL, "marcadaComo" boolean NOT NULL DEFAULT (0), "categoria" varchar CHECK( "categoria" IN ('HARDWARE','SOFTWARE','REDE','ACESSO','OUTRO') ) NOT NULL, "imagensUrls" text NOT NULL DEFAULT ('[]'), "dataCriacao" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, CONSTRAINT "REL_f176b612d6a8c1569bfc143da2" UNIQUE ("chamadoId"), CONSTRAINT "FK_f176b612d6a8c1569bfc143da29" FOREIGN KEY ("chamadoId") REFERENCES "chamado" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_solucao_conhecida"("id", "comoFoiResolvido", "marcadaComo", "categoria", "imagensUrls", "dataCriacao", "chamadoId") SELECT "id", "comoFoiResolvido", "marcadaComo", "categoria", "imagensUrls", "dataCriacao", "chamadoId" FROM "solucao_conhecida"`,
    );
    await queryRunner.query(`DROP TABLE "solucao_conhecida"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_solucao_conhecida" RENAME TO "solucao_conhecida"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_chamado_observador" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "adicionadoEm" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_d743ed001fa4402845118c52263" UNIQUE ("chamadoId", "usuarioId"), CONSTRAINT "FK_5c0fb265cf69175111b6c717eb2" FOREIGN KEY ("chamadoId") REFERENCES "chamado" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_3bc10edc420599272d97e752ad4" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_chamado_observador"("id", "adicionadoEm", "chamadoId", "usuarioId") SELECT "id", "adicionadoEm", "chamadoId", "usuarioId" FROM "chamado_observador"`,
    );
    await queryRunner.query(`DROP TABLE "chamado_observador"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_chamado_observador" RENAME TO "chamado_observador"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_chamado" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "descricao" text NOT NULL, "mensagemErro" text, "categoria" varchar CHECK( "categoria" IN ('HARDWARE','SOFTWARE','REDE','ACESSO','OUTRO') ) NOT NULL, "prioridade" varchar CHECK( "prioridade" IN ('BAIXA','MEDIA','ALTA') ) NOT NULL, "nivel" varchar CHECK( "nivel" IN ('N1','N2','N3') ) NOT NULL, "status" varchar CHECK( "status" IN ('PARADO','ANDAMENTO','FINALIZADO') ) NOT NULL DEFAULT ('PARADO'), "aguardandoRespostaDe" varchar CHECK( "aguardandoRespostaDe" IN ('COLABORADOR','TECNICO') ), "imagensUrls" text NOT NULL DEFAULT ('[]'), "anydeskId" text, "dataAbertura" datetime NOT NULL DEFAULT (datetime('now')), "dataAtualizacao" datetime NOT NULL DEFAULT (datetime('now')), "solicitanteId" integer NOT NULL, "tecnicoResponsavelId" integer, "abertoPorTecnicoId" integer, CONSTRAINT "FK_37231516b7302990555dd52a811" FOREIGN KEY ("solicitanteId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_6b04c20b06be651313cd9ec2f28" FOREIGN KEY ("tecnicoResponsavelId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_ad9ff89280ad71a7a683fb90b37" FOREIGN KEY ("abertoPorTecnicoId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_chamado"("id", "titulo", "descricao", "mensagemErro", "categoria", "prioridade", "nivel", "status", "aguardandoRespostaDe", "imagensUrls", "anydeskId", "dataAbertura", "dataAtualizacao", "solicitanteId", "tecnicoResponsavelId", "abertoPorTecnicoId") SELECT "id", "titulo", "descricao", "mensagemErro", "categoria", "prioridade", "nivel", "status", "aguardandoRespostaDe", "imagensUrls", "anydeskId", "dataAbertura", "dataAtualizacao", "solicitanteId", "tecnicoResponsavelId", "abertoPorTecnicoId" FROM "chamado"`,
    );
    await queryRunner.query(`DROP TABLE "chamado"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_chamado" RENAME TO "chamado"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_log_auditoria" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "acao" varchar CHECK( "acao" IN ('MUDANCA_STATUS','REABERTURA','ATRIBUICAO','EDICAO','COMENTARIO') ) NOT NULL, "descricao" text NOT NULL, "dataHora" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "FK_64d16a748b86aa93cd580b5ce37" FOREIGN KEY ("chamadoId") REFERENCES "chamado" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_de8b253a1f355a0a7ed36afe751" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_log_auditoria"("id", "acao", "descricao", "dataHora", "chamadoId", "usuarioId") SELECT "id", "acao", "descricao", "dataHora", "chamadoId", "usuarioId" FROM "log_auditoria"`,
    );
    await queryRunner.query(`DROP TABLE "log_auditoria"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_log_auditoria" RENAME TO "log_auditoria"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_aviso" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "mensagem" text NOT NULL, "tipo" varchar CHECK( "tipo" IN ('INFORMATIVO','ALERTA','MANUTENCAO') ) NOT NULL, "fixado" boolean NOT NULL DEFAULT (0), "publicadoEm" datetime NOT NULL DEFAULT (datetime('now')), "expiraEm" datetime, "autorId" integer NOT NULL, CONSTRAINT "FK_568942eb982fdfcff282ed57c86" FOREIGN KEY ("autorId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_aviso"("id", "titulo", "mensagem", "tipo", "fixado", "publicadoEm", "expiraEm", "autorId") SELECT "id", "titulo", "mensagem", "tipo", "fixado", "publicadoEm", "expiraEm", "autorId" FROM "aviso"`,
    );
    await queryRunner.query(`DROP TABLE "aviso"`);
    await queryRunner.query(`ALTER TABLE "temporary_aviso" RENAME TO "aviso"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_aviso_leitura" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "lidoEm" datetime NOT NULL DEFAULT (datetime('now')), "avisoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_f73d71d58224d546e5360079b47" UNIQUE ("avisoId", "usuarioId"), CONSTRAINT "FK_62e4fe3edcb3df732017c9f768c" FOREIGN KEY ("avisoId") REFERENCES "aviso" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_27604b7d137a71e546bf4cd6fc4" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_aviso_leitura"("id", "lidoEm", "avisoId", "usuarioId") SELECT "id", "lidoEm", "avisoId", "usuarioId" FROM "aviso_leitura"`,
    );
    await queryRunner.query(`DROP TABLE "aviso_leitura"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_aviso_leitura" RENAME TO "aviso_leitura"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_tarefa" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "descricao" text, "status" varchar CHECK( "status" IN ('A_FAZER','FAZENDO','CONCLUIDO') ) NOT NULL DEFAULT ('A_FAZER'), "criadaEm" datetime NOT NULL DEFAULT (datetime('now')), "atualizadaEm" datetime NOT NULL DEFAULT (datetime('now')), "usuarioId" integer NOT NULL, CONSTRAINT "FK_8552120aeb7fe1cf5c5c414e4ab" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_tarefa"("id", "titulo", "descricao", "status", "criadaEm", "atualizadaEm", "usuarioId") SELECT "id", "titulo", "descricao", "status", "criadaEm", "atualizadaEm", "usuarioId" FROM "tarefa"`,
    );
    await queryRunner.query(`DROP TABLE "tarefa"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_tarefa" RENAME TO "tarefa"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_anotacao" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conteudo" text NOT NULL, "criadaEm" datetime NOT NULL DEFAULT (datetime('now')), "atualizadaEm" datetime NOT NULL DEFAULT (datetime('now')), "usuarioId" integer NOT NULL, CONSTRAINT "FK_45828af32b6b3b135028251a2b0" FOREIGN KEY ("usuarioId") REFERENCES "usuario" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_anotacao"("id", "conteudo", "criadaEm", "atualizadaEm", "usuarioId") SELECT "id", "conteudo", "criadaEm", "atualizadaEm", "usuarioId" FROM "anotacao"`,
    );
    await queryRunner.query(`DROP TABLE "anotacao"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_anotacao" RENAME TO "anotacao"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "anotacao" RENAME TO "temporary_anotacao"`,
    );
    await queryRunner.query(
      `CREATE TABLE "anotacao" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conteudo" text NOT NULL, "criadaEm" datetime NOT NULL DEFAULT (datetime('now')), "atualizadaEm" datetime NOT NULL DEFAULT (datetime('now')), "usuarioId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "anotacao"("id", "conteudo", "criadaEm", "atualizadaEm", "usuarioId") SELECT "id", "conteudo", "criadaEm", "atualizadaEm", "usuarioId" FROM "temporary_anotacao"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_anotacao"`);
    await queryRunner.query(
      `ALTER TABLE "tarefa" RENAME TO "temporary_tarefa"`,
    );
    await queryRunner.query(
      `CREATE TABLE "tarefa" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "descricao" text, "status" varchar CHECK( "status" IN ('A_FAZER','FAZENDO','CONCLUIDO') ) NOT NULL DEFAULT ('A_FAZER'), "criadaEm" datetime NOT NULL DEFAULT (datetime('now')), "atualizadaEm" datetime NOT NULL DEFAULT (datetime('now')), "usuarioId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "tarefa"("id", "titulo", "descricao", "status", "criadaEm", "atualizadaEm", "usuarioId") SELECT "id", "titulo", "descricao", "status", "criadaEm", "atualizadaEm", "usuarioId" FROM "temporary_tarefa"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_tarefa"`);
    await queryRunner.query(
      `ALTER TABLE "aviso_leitura" RENAME TO "temporary_aviso_leitura"`,
    );
    await queryRunner.query(
      `CREATE TABLE "aviso_leitura" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "lidoEm" datetime NOT NULL DEFAULT (datetime('now')), "avisoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_f73d71d58224d546e5360079b47" UNIQUE ("avisoId", "usuarioId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "aviso_leitura"("id", "lidoEm", "avisoId", "usuarioId") SELECT "id", "lidoEm", "avisoId", "usuarioId" FROM "temporary_aviso_leitura"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_aviso_leitura"`);
    await queryRunner.query(`ALTER TABLE "aviso" RENAME TO "temporary_aviso"`);
    await queryRunner.query(
      `CREATE TABLE "aviso" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "mensagem" text NOT NULL, "tipo" varchar CHECK( "tipo" IN ('INFORMATIVO','ALERTA','MANUTENCAO') ) NOT NULL, "fixado" boolean NOT NULL DEFAULT (0), "publicadoEm" datetime NOT NULL DEFAULT (datetime('now')), "expiraEm" datetime, "autorId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "aviso"("id", "titulo", "mensagem", "tipo", "fixado", "publicadoEm", "expiraEm", "autorId") SELECT "id", "titulo", "mensagem", "tipo", "fixado", "publicadoEm", "expiraEm", "autorId" FROM "temporary_aviso"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_aviso"`);
    await queryRunner.query(
      `ALTER TABLE "log_auditoria" RENAME TO "temporary_log_auditoria"`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_auditoria" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "acao" varchar CHECK( "acao" IN ('MUDANCA_STATUS','REABERTURA','ATRIBUICAO','EDICAO','COMENTARIO') ) NOT NULL, "descricao" text NOT NULL, "dataHora" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "log_auditoria"("id", "acao", "descricao", "dataHora", "chamadoId", "usuarioId") SELECT "id", "acao", "descricao", "dataHora", "chamadoId", "usuarioId" FROM "temporary_log_auditoria"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_log_auditoria"`);
    await queryRunner.query(
      `ALTER TABLE "chamado" RENAME TO "temporary_chamado"`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamado" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titulo" varchar NOT NULL, "descricao" text NOT NULL, "mensagemErro" text, "categoria" varchar CHECK( "categoria" IN ('HARDWARE','SOFTWARE','REDE','ACESSO','OUTRO') ) NOT NULL, "prioridade" varchar CHECK( "prioridade" IN ('BAIXA','MEDIA','ALTA') ) NOT NULL, "nivel" varchar CHECK( "nivel" IN ('N1','N2','N3') ) NOT NULL, "status" varchar CHECK( "status" IN ('PARADO','ANDAMENTO','FINALIZADO') ) NOT NULL DEFAULT ('PARADO'), "aguardandoRespostaDe" varchar CHECK( "aguardandoRespostaDe" IN ('COLABORADOR','TECNICO') ), "imagensUrls" text NOT NULL DEFAULT ('[]'), "anydeskId" text, "dataAbertura" datetime NOT NULL DEFAULT (datetime('now')), "dataAtualizacao" datetime NOT NULL DEFAULT (datetime('now')), "solicitanteId" integer NOT NULL, "tecnicoResponsavelId" integer, "abertoPorTecnicoId" integer)`,
    );
    await queryRunner.query(
      `INSERT INTO "chamado"("id", "titulo", "descricao", "mensagemErro", "categoria", "prioridade", "nivel", "status", "aguardandoRespostaDe", "imagensUrls", "anydeskId", "dataAbertura", "dataAtualizacao", "solicitanteId", "tecnicoResponsavelId", "abertoPorTecnicoId") SELECT "id", "titulo", "descricao", "mensagemErro", "categoria", "prioridade", "nivel", "status", "aguardandoRespostaDe", "imagensUrls", "anydeskId", "dataAbertura", "dataAtualizacao", "solicitanteId", "tecnicoResponsavelId", "abertoPorTecnicoId" FROM "temporary_chamado"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_chamado"`);
    await queryRunner.query(
      `ALTER TABLE "chamado_observador" RENAME TO "temporary_chamado_observador"`,
    );
    await queryRunner.query(
      `CREATE TABLE "chamado_observador" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "adicionadoEm" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "usuarioId" integer NOT NULL, CONSTRAINT "UQ_d743ed001fa4402845118c52263" UNIQUE ("chamadoId", "usuarioId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "chamado_observador"("id", "adicionadoEm", "chamadoId", "usuarioId") SELECT "id", "adicionadoEm", "chamadoId", "usuarioId" FROM "temporary_chamado_observador"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_chamado_observador"`);
    await queryRunner.query(
      `ALTER TABLE "solucao_conhecida" RENAME TO "temporary_solucao_conhecida"`,
    );
    await queryRunner.query(
      `CREATE TABLE "solucao_conhecida" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "comoFoiResolvido" text NOT NULL, "marcadaComo" boolean NOT NULL DEFAULT (0), "categoria" varchar CHECK( "categoria" IN ('HARDWARE','SOFTWARE','REDE','ACESSO','OUTRO') ) NOT NULL, "imagensUrls" text NOT NULL DEFAULT ('[]'), "dataCriacao" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, CONSTRAINT "REL_f176b612d6a8c1569bfc143da2" UNIQUE ("chamadoId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "solucao_conhecida"("id", "comoFoiResolvido", "marcadaComo", "categoria", "imagensUrls", "dataCriacao", "chamadoId") SELECT "id", "comoFoiResolvido", "marcadaComo", "categoria", "imagensUrls", "dataCriacao", "chamadoId" FROM "temporary_solucao_conhecida"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_solucao_conhecida"`);
    await queryRunner.query(
      `ALTER TABLE "comentario" RENAME TO "temporary_comentario"`,
    );
    await queryRunner.query(
      `CREATE TABLE "comentario" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "texto" text NOT NULL, "tipo" varchar CHECK( "tipo" IN ('COMENTARIO','NIVEL_AJUSTADO') ) NOT NULL DEFAULT ('COMENTARIO'), "interno" boolean NOT NULL DEFAULT (0), "imagemUrl" text, "ehObservador" boolean NOT NULL DEFAULT (0), "dataCriacao" datetime NOT NULL DEFAULT (datetime('now')), "chamadoId" integer NOT NULL, "autorId" integer NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "comentario"("id", "texto", "tipo", "interno", "imagemUrl", "ehObservador", "dataCriacao", "chamadoId", "autorId") SELECT "id", "texto", "tipo", "interno", "imagemUrl", "ehObservador", "dataCriacao", "chamadoId", "autorId" FROM "temporary_comentario"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_comentario"`);
    await queryRunner.query(`DROP TABLE "anotacao"`);
    await queryRunner.query(`DROP TABLE "tarefa"`);
    await queryRunner.query(`DROP TABLE "aviso_leitura"`);
    await queryRunner.query(`DROP TABLE "aviso"`);
    await queryRunner.query(`DROP TABLE "log_auditoria"`);
    await queryRunner.query(`DROP TABLE "dashboard_widget"`);
    await queryRunner.query(`DROP TABLE "usuario"`);
    await queryRunner.query(`DROP TABLE "chamado"`);
    await queryRunner.query(`DROP TABLE "chamado_observador"`);
    await queryRunner.query(`DROP TABLE "solucao_conhecida"`);
    await queryRunner.query(`DROP TABLE "comentario"`);
  }
}
