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
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { SetoresService } from './setores.service';
import { CriarSetorDto } from './dto/criar-setor.dto';
import { CriarMapeamentoSetorDto } from './dto/criar-mapeamento-setor.dto';
import { AtualizarMapeamentoSetorDto } from './dto/atualizar-mapeamento-setor.dto';
import { mapSetorParaResposta } from './dto/setor-response.dto';
import { mapMapeamentoParaResposta } from './dto/mapeamento-setor-response.dto';

@Controller('setores')
export class SetoresController {
  constructor(private readonly setoresService: SetoresService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async listar() {
    const setores = await this.setoresService.listarSetores();
    return setores.map(mapSetorParaResposta);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async criar(@Body() dto: CriarSetorDto) {
    const setor = await this.setoresService.criarSetor(dto);
    return mapSetorParaResposta(setor);
  }

  // Precisa vir ANTES de qualquer rota dinâmica que pudesse colidir —
  // não há hoje (sem @Get(':id') neste controller), mas mantém o mesmo
  // hábito de organização do resto do projeto.
  @Get('mapeamentos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async listarMapeamentos() {
    const mapeamentos = await this.setoresService.listarMapeamentos();
    return mapeamentos.map(mapMapeamentoParaResposta);
  }

  @Post('mapeamentos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async criarMapeamento(@Body() dto: CriarMapeamentoSetorDto) {
    const mapeamento = await this.setoresService.criarMapeamento(dto);
    return mapMapeamentoParaResposta(mapeamento);
  }

  @Patch('mapeamentos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async atualizarMapeamento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarMapeamentoSetorDto,
  ) {
    const mapeamento = await this.setoresService.atualizarMapeamento(id, dto);
    return mapMapeamentoParaResposta(mapeamento);
  }

  // SEM guard, de propósito — chamado pela tela de Primeiro Acesso, que
  // roda ANTES de existir qualquer sessão/token (mesma situação de
  // POST /auth/primeiro-acesso, ver auth.controller.ts). Não expõe nada
  // sensível: só "qual setor esse prefixo de e-mail sugere", a mesma
  // informação que já era código-fonte público no frontend antes desta
  // mudança (departamentoPorEmail.js).
  @Get('sugerir')
  async sugerir(@Query('email') email: string) {
    const setor = await this.setoresService.buscarSetorPorEmail(email ?? '');
    return { setor: setor ? mapSetorParaResposta(setor) : null };
  }
}
