import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { DashboardWidgetsService } from './dashboard-widgets.service';
import { DashboardWidgetsController } from './dashboard-widgets.controller';

// Não importa ChamadosModule de propósito: DashboardWidget é só a
// CONFIGURAÇÃO de cada widget (o que agrupar, como exibir, em que ordem) —
// quem busca os DADOS de cada widget é o frontend, chamando GET
// /chamados/metricas ou /chamados/repeticao separadamente. Zero
// acoplamento novo entre os dois módulos.
@Module({
  imports: [TypeOrmModule.forFeature([DashboardWidget])],
  providers: [DashboardWidgetsService],
  controllers: [DashboardWidgetsController],
})
export class DashboardModule {}
