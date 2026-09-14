import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ChamadosModule } from './chamados/chamados.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { SolucoesConhecidasModule } from './solucoes-conhecidas/solucoes-conhecidas.module';
import { SeedModule } from './database/seed.module';
import { UploadsModule } from './uploads/uploads.module';
import { ObservadoresModule } from './observadores/observadores.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LogAuditoriaModule } from './log-auditoria/log-auditoria.module';
import { AvisosModule } from './avisos/avisos.module';
import { TarefasModule } from './tarefas/tarefas.module';
import { AnotacoesModule } from './anotacoes/anotacoes.module';
import { ForumModule } from './forum/forum.module';
import { SetoresModule } from './setores/setores.module';
import { GruposModule } from './grupos/grupos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { LogAcessoModule } from './log-acesso/log-acesso.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { Usuario } from './usuarios/entities/usuario.entity';
import { Chamado } from './chamados/entities/chamado.entity';
import { Comentario } from './comentarios/entities/comentario.entity';
import { SolucaoConhecida } from './solucoes-conhecidas/entities/solucao-conhecida.entity';
import { ChamadoObservador } from './observadores/entities/chamado-observador.entity';
import { DashboardWidget } from './dashboard/entities/dashboard-widget.entity';
import { LogAuditoria } from './log-auditoria/entities/log-auditoria.entity';
import { Aviso } from './avisos/entities/aviso.entity';
import { AvisoLeitura } from './avisos/entities/aviso-leitura.entity';
import { Tarefa } from './tarefas/entities/tarefa.entity';
import { Anotacao } from './anotacoes/entities/anotacao.entity';
import { SugestaoForum } from './forum/entities/sugestao-forum.entity';
import { ComentarioForum } from './forum/entities/comentario-forum.entity';
import { Setor } from './setores/entities/setor.entity';
import { MapeamentoSetorEmail } from './setores/entities/mapeamento-setor-email.entity';
import { Grupo } from './grupos/entities/grupo.entity';
import { Categoria } from './categorias/entities/categoria.entity';
import { LogAcesso } from './log-acesso/entities/log-acesso.entity';

@Module({
  imports: [
    // isGlobal: true faz o ConfigService (que lê o .env) ficar disponível
    // em QUALQUER módulo sem precisar importar ConfigModule de novo em cada
    // um — só o AppModule declara isso.
    ConfigModule.forRoot({ isGlobal: true }),

    // forRootAsync porque a configuração de conexão (DATABASE_URL) vem do
    // ConfigService, que depende do ConfigModule já ter carregado o .env
    // primeiro.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        // Postgres (antes era better-sqlite3, usado só na fase de
        // prototipagem) — DATABASE_URL vem do .env, nunca hardcoded aqui;
        // local de teste e produção usam URLs diferentes, cada uma no seu
        // próprio .env (ver README).
        type: 'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        entities: [
          Usuario,
          Chamado,
          Comentario,
          SolucaoConhecida,
          ChamadoObservador,
          DashboardWidget,
          LogAuditoria,
          Aviso,
          AvisoLeitura,
          Tarefa,
          Anotacao,
          SugestaoForum,
          ComentarioForum,
          Setor,
          MapeamentoSetorEmail,
          Grupo,
          Categoria,
          LogAcesso,
        ],
        // Migrations (não mais synchronize:true) são quem manda no schema —
        // ver src/migrations/ e src/data-source.ts (usado só pela CLI). O
        // schema atual (todas as tabelas já existentes) foi congelado na
        // migration InitialSchema, gerada e validada como estruturalmente
        // idêntica ao que synchronize:true criava (mesmas colunas, tipos,
        // defaults, PKs, FKs e índices). synchronize:true era aceitável só
        // enquanto não havia dado real acumulado — a partir daqui, qualquer
        // mudança de entity precisa de uma migration nova (ver README).
        migrations: [join(__dirname, 'migrations', '*{.js,.ts}')],
        synchronize: false,
      }),
    }),

    // ThrottlerModule.forRoot registra o limite PADRÃO de requisições por
    // IP pra toda a API (bem mais folgado que o de /auth/login, que usa
    // @Throttle(...) pra sobrescrever esse padrão só naquela rota).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

    // Serve o build de produção do frontend (frontend/dist) em GET / e
    // demais rotas não-API — com fallback pro index.html (roteamento
    // client-side). exclude cobre /api (rotas de controller, prefixo
    // definido em main.ts) e /uploads (arquivos enviados, servidos à parte
    // por app.useStaticAssets em main.ts) pra o catch-all do SPA nunca
    // interceptar essas duas coisas. Sintaxe `{*splat}` porque o Nest 11
    // roda sobre Express 5 / path-to-regexp v8, que não aceita mais `*`
    // solto como wildcard.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      exclude: ['/api/{*splat}', '/uploads/{*splat}'],
    }),

    AuthModule,
    UsuariosModule,
    ChamadosModule,
    ComentariosModule,
    SolucoesConhecidasModule,
    ObservadoresModule,
    SeedModule,
    UploadsModule,
    DashboardModule,
    LogAuditoriaModule,
    AvisosModule,
    TarefasModule,
    AnotacoesModule,
    ForumModule,
    SetoresModule,
    GruposModule,
    CategoriasModule,
    LogAcessoModule,
    RelatoriosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // APP_GUARD é um token especial do NestJS: registrar um provider com
    // esse token aplica o guard GLOBALMENTE, em toda rota de todo
    // controller, sem precisar de @UseGuards(ThrottlerGuard) em cada um.
    // Sem isso, o @Throttle(...) do AuthController não teria efeito nenhum
    // — ele só define o limite, quem FISCALIZA é o guard.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
