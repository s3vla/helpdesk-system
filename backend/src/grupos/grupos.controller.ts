import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { GruposService } from './grupos.service';
import { CriarGrupoDto } from './dto/criar-grupo.dto';
import { AtualizarGrupoDto } from './dto/atualizar-grupo.dto';
import { AdicionarMembroDto } from './dto/adicionar-membro.dto';
import { mapGrupoParaResposta } from './dto/grupo-response.dto';

// Só TECNICO — grupo é uma ferramenta organizacional da Área Técnica, sem
// nenhuma tela do lado colaborador que precise disto (ver escopo aprovado:
// só criar grupo e adicionar/remover membro, nada funcional em cima).
@Controller('grupos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.TECNICO)
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
  async listar() {
    const grupos = await this.gruposService.listarGrupos();
    return grupos.map(mapGrupoParaResposta);
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    const grupo = await this.gruposService.buscarPorIdOuFalhar(id);
    return mapGrupoParaResposta(grupo);
  }

  @Post()
  async criar(@Body() dto: CriarGrupoDto) {
    const grupo = await this.gruposService.criarGrupo(dto);
    return mapGrupoParaResposta(grupo);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarGrupoDto,
  ) {
    const grupo = await this.gruposService.atualizarGrupo(id, dto);
    return mapGrupoParaResposta(grupo);
  }

  // Exclusão física — bloqueada quando o grupo ainda está referenciado por
  // algum Aviso (ver GruposService.remover, mesmo padrão de
  // CategoriasController.remover).
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id', ParseIntPipe) id: number) {
    await this.gruposService.remover(id);
  }

  @Post(':id/membros')
  async adicionarMembro(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdicionarMembroDto,
  ) {
    const grupo = await this.gruposService.adicionarMembro(id, dto.usuarioId);
    return mapGrupoParaResposta(grupo);
  }

  @Delete(':id/membros/:usuarioId')
  async removerMembro(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    const grupo = await this.gruposService.removerMembro(id, usuarioId);
    return mapGrupoParaResposta(grupo);
  }
}
