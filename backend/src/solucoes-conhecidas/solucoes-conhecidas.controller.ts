import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SolucoesConhecidasService } from './solucoes-conhecidas.service';
import { FiltrosSolucaoDto } from './dto/filtros-solucao.dto';

// @Controller('solucoes-conhecidas') define o prefixo de rota — todo método
// aqui dentro vive sob /solucoes-conhecidas. @UseGuards(JwtAuthGuard) na
// classe protege TODAS as rotas do controller de uma vez (equivalente a
// colocar o guard em cada método individualmente).
@Controller('solucoes-conhecidas')
@UseGuards(JwtAuthGuard)
export class SolucoesConhecidasController {
  constructor(
    private readonly solucoesConhecidasService: SolucoesConhecidasService,
  ) {}

  // O controller só recebe a requisição, delega pro service e devolve o
  // resultado — nenhuma regra de negócio (o que conta como "solução
  // conhecida", como calcular ocorrências) mora aqui.
  @Get()
  listar(@Query() filtros: FiltrosSolucaoDto) {
    return this.solucoesConhecidasService.listar(filtros);
  }
}
