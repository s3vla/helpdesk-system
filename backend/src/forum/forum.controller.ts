import {
  Body,
  Controller,
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
import { ForumService } from './forum.service';
import { CriarSugestaoDto } from './dto/criar-sugestao.dto';
import { CriarComentarioForumDto } from './dto/criar-comentario-forum.dto';
import { AtualizarStatusSugestaoDto } from './dto/atualizar-status-sugestao.dto';
import { FiltrosSugestaoDto } from './dto/filtros-sugestao.dto';

// @UseGuards(JwtAuthGuard, RolesGuard) na classe: toda rota exige sessão
// válida; só PATCH /:id/status leva @Roles(TECNICO) — criar sugestão e
// comentar ficam abertos pra qualquer tipo autenticado (mesmo padrão de
// AvisosController, invertido: lá só publicar é restrito, aqui só mudar
// status é).
@Controller('forum')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get()
  async listar(@Query() filtros: FiltrosSugestaoDto) {
    return this.forumService.listar(filtros);
  }

  @Get(':id')
  async buscarDetalhe(@Param('id', ParseIntPipe) id: number) {
    return this.forumService.buscarDetalhe(id);
  }

  @Post()
  async criar(
    @Body() dto: CriarSugestaoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    return this.forumService.criar(dto, usuarioAtual.sub);
  }

  @Post(':id/comentarios')
  async comentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarComentarioForumDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    return this.forumService.comentar(id, dto, usuarioAtual.sub);
  }

  @Patch(':id/status')
  @Roles(TipoUsuario.TECNICO)
  async atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarStatusSugestaoDto,
  ) {
    return this.forumService.atualizarStatus(id, dto);
  }
}
