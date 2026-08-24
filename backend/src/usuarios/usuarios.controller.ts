import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { UsuariosService } from './usuarios.service';
import { ChamadosService } from '../chamados/chamados.service';
import { mapUsuarioParaResposta } from './dto/usuario-response.dto';
import { mapChamadoParaResposta } from '../chamados/dto/chamado-response.dto';

// As duas rotas daqui só existem pro painel de TI ("Colaboradores"), então
// @Roles(TECNICO) fica na classe inteira — nenhum colaborador tem por que
// listar outros colaboradores ou ver o histórico de chamados de outra
// pessoa.
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.TECNICO)
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly chamadosService: ChamadosService,
  ) {}

  @Get()
  async listar() {
    const usuarios = await this.usuariosService.listarColaboradores();
    return usuarios.map(mapUsuarioParaResposta);
  }

  // Precisa vir ANTES de @Get(':id/chamados') só por hábito de organização
  // — não colidem de fato (segmentos diferentes: /usuarios/tecnicos tem 1
  // segmento, /usuarios/:id/chamados tem 2), mas mantém as rotas estáticas
  // agrupadas antes das dinâmicas, mesmo padrão de chamados.controller.ts.
  @Get('tecnicos')
  async listarTecnicos() {
    const tecnicos = await this.usuariosService.listarTecnicos();
    return tecnicos.map(mapUsuarioParaResposta);
  }

  @Get(':id/chamados')
  async listarChamadosDoUsuario(@Param('id', ParseIntPipe) id: number) {
    const chamados = await this.chamadosService.listarPorUsuario(id);
    return chamados.map(mapChamadoParaResposta);
  }

  // Mecanismo de reset pra e-mails de cargo que trocam de responsável (ex:
  // faturamento02@): apaga nome/cargo/senha da conta atual, liberando o
  // e-mail pra rodar Primeiro Acesso de novo. Sem corpo na requisição — o
  // :id já diz qual conta resetar, e quem pode fazer isso é decidido pelos
  // guards da classe (só TECNICO).
  @Patch(':id/resetar')
  async resetar(@Param('id', ParseIntPipe) id: number) {
    const usuario = await this.usuariosService.resetar(id);
    return mapUsuarioParaResposta(usuario);
  }
}
