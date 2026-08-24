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
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AnotacoesService } from './anotacoes.service';
import { CriarAnotacaoDto } from './dto/criar-anotacao.dto';
import { AtualizarAnotacaoDto } from './dto/atualizar-anotacao.dto';
import { mapAnotacaoParaResposta } from './dto/anotacao-response.dto';

// Sem @Roles em nenhuma rota — mesmo padrão de TarefasController: qualquer
// tipo autenticado tem as próprias anotações, sem distinção.
@Controller('anotacoes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnotacoesController {
  constructor(private readonly anotacoesService: AnotacoesService) {}

  @Get()
  async listar(@UsuarioAtual() usuarioAtual: JwtPayload) {
    const anotacoes = await this.anotacoesService.listar(usuarioAtual.sub);
    return anotacoes.map(mapAnotacaoParaResposta);
  }

  @Post()
  async criar(
    @Body() dto: CriarAnotacaoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const anotacao = await this.anotacoesService.criar(dto, usuarioAtual.sub);
    return mapAnotacaoParaResposta(anotacao);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarAnotacaoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const anotacao = await this.anotacoesService.atualizar(
      id,
      usuarioAtual.sub,
      dto,
    );
    return mapAnotacaoParaResposta(anotacao);
  }

  @Delete(':id')
  async remover(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    await this.anotacoesService.remover(id, usuarioAtual.sub);
  }
}
