import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { DashboardWidgetsService } from './dashboard-widgets.service';
import { CriarWidgetDto } from './dto/criar-widget.dto';
import { AtualizarWidgetDto } from './dto/atualizar-widget.dto';
import { MoverWidgetDto } from './dto/mover-widget.dto';
import { mapWidgetParaResposta } from './dto/widget-response.dto';

// TECNICO-only na classe inteira, mesmo padrão de ChamadosController pras
// rotas exclusivas de TI — qualquer um dos dois técnicos pode
// criar/editar/reordenar/remover, sem distinção de "dono" do widget (ver
// decisão da feature: widgets compartilhados, sem FK pra Usuario).
@Controller('dashboard/widgets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.TECNICO)
export class DashboardWidgetsController {
  constructor(
    private readonly dashboardWidgetsService: DashboardWidgetsService,
  ) {}

  @Get()
  async listar() {
    const widgets = await this.dashboardWidgetsService.listar();
    return widgets.map(mapWidgetParaResposta);
  }

  @Post()
  async criar(@Body() dto: CriarWidgetDto) {
    const widget = await this.dashboardWidgetsService.criar(dto);
    return mapWidgetParaResposta(widget);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarWidgetDto,
  ) {
    const widget = await this.dashboardWidgetsService.atualizar(id, dto);
    return mapWidgetParaResposta(widget);
  }

  // Precisa vir ANTES de @Patch(':id') seria um problema só se as duas
  // rotas competissem pelo mesmo padrão — aqui não competem (":id/mover"
  // tem um segmento a mais), mas mantém a mesma ordem de leitura de
  // "ações específicas antes de rotas genéricas" usada em
  // ChamadosController.
  @Patch(':id/mover')
  async mover(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoverWidgetDto,
  ) {
    const widgets = await this.dashboardWidgetsService.mover(id, dto.direcao);
    return widgets.map(mapWidgetParaResposta);
  }

  @Delete(':id')
  async remover(@Param('id', ParseIntPipe) id: number) {
    await this.dashboardWidgetsService.remover(id);
  }
}
