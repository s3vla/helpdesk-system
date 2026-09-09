// DataSource usado só pela CLI do TypeORM (migration:generate/run/revert —
// ver scripts no package.json e o README). Existe separado do
// TypeOrmModule.forRootAsync em app.module.ts porque a CLI roda por fora do
// Nest (não tem ConfigModule/DI disponível) — então lê `process.env`
// diretamente, carregando o .env manualmente com dotenv/config, em vez de
// passar por ConfigService. A lista de entities e o caminho do banco têm
// que continuar batendo com app.module.ts sempre que uma entity nova for
// adicionada.
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';
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

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH ?? 'database.sqlite',
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
  // migrations (não schema automático) é quem manda no schema a partir de
  // agora — ver app.module.ts (synchronize: false) e o README pra o
  // processo de criar uma migration nova.
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
});
