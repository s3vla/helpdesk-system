import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AvisosService } from './avisos.service';
import { CriarAvisoDto } from './dto/criar-aviso.dto';
import { AtualizarAvisoDto } from './dto/atualizar-aviso.dto';
import { FiltrosAvisoDto } from './dto/filtros-aviso.dto';

// @UseGuards(JwtAuthGuard, RolesGuard) na classe: toda rota exige sessão
// válida; @Roles(TECNICO) por método restringe ainda mais publicar/
// editar/excluir (mesmo padrão de ChamadosController) — ler o mural e
// marcar como lido ficam abertos pra qualquer tipo autenticado.
@Controller('avisos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  @Get()
  async listar(
    @Query() filtros: FiltrosAvisoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    return this.avisosService.listar(usuarioAtual, filtros);
  }

  // Precisa vir ANTES de rotas exclusivas de :id só por organização de
  // leitura — não há colisão de path real com elas (mesmo caso já discutido
  // em ChamadosController pra /meus, /observando etc.).
  @Get('nao-lidos/contagem')
  async contarNaoLidos(@UsuarioAtual() usuarioAtual: JwtPayload) {
    const total = await this.avisosService.contarNaoLidos(usuarioAtual.sub);
    return { total };
  }

  // Lista de quem já leu — só técnico (ver painel "Visto por X pessoas" no
  // frontend, exclusivo dessa área). Não colide com nenhuma rota GET
  // acima: segundo segmento sempre literal ("leitores" aqui, "contagem" lá).
  @Get(':id/leitores')
  @Roles(TipoUsuario.TECNICO)
  async listarLeitores(@Param('id', ParseIntPipe) id: number) {
    return this.avisosService.listarLeitores(id);
  }

  @Post()
  @Roles(TipoUsuario.TECNICO)
  async criar(
    @Body() dto: CriarAvisoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    return this.avisosService.criar(dto, usuarioAtual.sub);
  }

  @Patch(':id')
  @Roles(TipoUsuario.TECNICO)
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarAvisoDto,
  ) {
    return this.avisosService.atualizar(id, dto);
  }

  @Delete(':id')
  @Roles(TipoUsuario.TECNICO)
  async remover(@Param('id', ParseIntPipe) id: number) {
    await this.avisosService.remover(id);
  }

  @Post(':id/marcar-lido')
  async marcarLido(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    await this.avisosService.marcarLido(id, usuarioAtual.sub);
  }
}
