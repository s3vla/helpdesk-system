import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    // isGlobal: true faz o ConfigService (que lê o .env) ficar disponível
    // em QUALQUER módulo sem precisar importar ConfigModule de novo em cada
    // um — só o AppModule declara isso.
    ConfigModule.forRoot({ isGlobal: true }),

    // forRootAsync porque a configuração de conexão (caminho do arquivo
    // SQLite) vem do ConfigService, que depende do ConfigModule já ter
    // carregado o .env primeiro.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        // TypeORM aposentou o driver "sqlite" clássico (baseado no pacote
        // `sqlite3`) em favor de "better-sqlite3" — mais rápido por ser
        // síncrono e o único suportado nesta versão. Pra quem só vai
        // trocar pra Postgres/MySQL depois, isso não muda nada no resto do
        // código: só este `type` (e a variável de conexão) mudam.
        type: 'better-sqlite3',
        database: configService.get<string>('DATABASE_PATH', 'database.sqlite'),
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
        ],
        // synchronize:true faz o TypeORM criar/ajustar as tabelas a partir
        // das entities automaticamente — ótimo pra aprender e prototipar,
        // PERIGOSO em produção (pode alterar/apagar dados sem aviso). Ao
        // trocar para Postgres/MySQL, troque isso por migrations reais.
        synchronize: true,
      }),
    }),

    // ThrottlerModule.forRoot registra o limite PADRÃO de requisições por
    // IP pra toda a API (bem mais folgado que o de /auth/login, que usa
    // @Throttle(...) pra sobrescrever esse padrão só naquela rota).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

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
