import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { RelatoriosService } from './relatorios.service';
import { FiltroAcessoDto } from './dto/filtro-acesso.dto';
import { PeriodoChamadoDto } from '../chamados/dto/periodo-chamado.dto';

// Nova aba "Atividade" em Administração — só TECNICO, mesmo padrão de
// UsuariosController/SetoresController (guard na classe inteira, sem rota
// pública nenhuma aqui).
@Controller('admin/relatorios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.TECNICO)
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('acesso')
  async acesso(@Query() filtros: FiltroAcessoDto) {
    return this.relatoriosService.relatorioAcesso(filtros);
  }

  // Reaproveita PeriodoChamadoDto (dataInicio/dataFim, default últimos 30
  // dias) — mesmo DTO que GET /chamados/metricas já usa, ver comentário em
  // ChamadosService.
  @Get('atividade-chamados')
  async atividadeChamados(@Query() filtros: PeriodoChamadoDto) {
    return this.relatoriosService.relatorioAtividadeChamados(filtros);
  }

  @Get('tempo-atendimento')
  async tempoAtendimento(@Query() filtros: PeriodoChamadoDto) {
    return this.relatoriosService.relatorioTempoAtendimento(filtros);
  }
}
