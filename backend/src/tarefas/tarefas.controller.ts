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
import { TarefasService } from './tarefas.service';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { mapTarefaParaResposta } from './dto/tarefa-response.dto';

// Sem @Roles em nenhuma rota — colaborador e técnico têm as PRÓPRIAS
// tarefas pessoais, sem distinção de tipo. RolesGuard continua na classe
// mesmo assim (mesmo padrão de AvisosController): não restringe nada aqui,
// mas mantém a mesma ordem autentica-depois-autoriza do resto da API.
@Controller('tarefas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Get()
  async listar(@UsuarioAtual() usuarioAtual: JwtPayload) {
    const tarefas = await this.tarefasService.listar(usuarioAtual.sub);
    return tarefas.map(mapTarefaParaResposta);
  }

  @Post()
  async criar(
    @Body() dto: CriarTarefaDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const tarefa = await this.tarefasService.criar(dto, usuarioAtual.sub);
    return mapTarefaParaResposta(tarefa);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarTarefaDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const tarefa = await this.tarefasService.atualizar(
      id,
      usuarioAtual.sub,
      dto,
    );
    return mapTarefaParaResposta(tarefa);
  }

  @Delete(':id')
  async remover(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    await this.tarefasService.remover(id, usuarioAtual.sub);
  }
}
