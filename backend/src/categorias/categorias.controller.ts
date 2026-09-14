import {
  Body,
  Controller,
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
import { CategoriasService } from './categorias.service';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { mapCategoriaParaResposta } from './dto/categoria-response.dto';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  // Qualquer autenticado (colaborador OU técnico) — precisa disso pra
  // popular o dropdown de "Abrir chamado", dos dois lados. Diferente de
  // /categorias (abaixo), que é admin-only.
  @Get('ativas')
  @UseGuards(JwtAuthGuard)
  async listarAtivas() {
    const categorias = await this.categoriasService.listarAtivas();
    return categorias.map(mapCategoriaParaResposta);
  }

  // Só TECNICO daqui pra baixo — tela de Administração → Categorias.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async listarTodas() {
    const categorias = await this.categoriasService.listarTodas();
    return categorias.map(mapCategoriaParaResposta);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async criar(@Body() dto: CriarCategoriaDto) {
    const categoria = await this.categoriasService.criar(dto);
    return mapCategoriaParaResposta(categoria);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarCategoriaDto,
  ) {
    const categoria = await this.categoriasService.atualizar(id, dto);
    return mapCategoriaParaResposta(categoria);
  }
}
