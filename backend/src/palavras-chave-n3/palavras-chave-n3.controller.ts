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
import { PalavrasChaveN3Service } from './palavras-chave-n3.service';
import { CriarPalavraChaveN3Dto } from './dto/criar-palavra-chave-n3.dto';
import { AtualizarPalavraChaveN3Dto } from './dto/atualizar-palavra-chave-n3.dto';
import { mapPalavraChaveN3ParaResposta } from './dto/palavra-chave-n3-response.dto';

// Só TECNICO — dicionário usado internamente pela triagem automática, sem
// nenhuma tela do lado colaborador (mesmo escopo de GruposController).
@Controller('palavras-chave-n3')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.TECNICO)
export class PalavrasChaveN3Controller {
  constructor(
    private readonly palavrasChaveN3Service: PalavrasChaveN3Service,
  ) {}

  @Get()
  async listarTodas() {
    const palavrasChave = await this.palavrasChaveN3Service.listarTodas();
    return palavrasChave.map(mapPalavraChaveN3ParaResposta);
  }

  @Post()
  async criar(@Body() dto: CriarPalavraChaveN3Dto) {
    const palavraChave = await this.palavrasChaveN3Service.criar(dto);
    return mapPalavraChaveN3ParaResposta(palavraChave);
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarPalavraChaveN3Dto,
  ) {
    const palavraChave = await this.palavrasChaveN3Service.atualizar(
      id,
      dto,
    );
    return mapPalavraChaveN3ParaResposta(palavraChave);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id', ParseIntPipe) id: number) {
    await this.palavrasChaveN3Service.remover(id);
  }
}
