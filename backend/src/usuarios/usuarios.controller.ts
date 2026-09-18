import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { FiltrosColaboradorDto } from './dto/filtros-colaborador.dto';
import { UsuariosService } from './usuarios.service';
import { ChamadosService } from '../chamados/chamados.service';
import { mapUsuarioParaResposta } from './dto/usuario-response.dto';
import { ColaboradorListaResponseDto } from './dto/colaborador-lista-response.dto';
import { mapChamadoParaResposta } from '../chamados/dto/chamado-response.dto';

// GET /usuarios/:id/chamados nunca deve truncar: ITUsers.jsx soma esses
// chamados pra mostrar "total/abertos/finalizados" por colaborador, e um
// limite baixo faria essas contagens mentirem em silêncio pra qualquer
// colaborador com mais chamados que o tamanho de uma página. 10 mil é
// "sem limite" na prática pra este sistema.
const SEM_LIMITE_PRATICO = 10_000;

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
  async listar(@Query() filtros: FiltrosColaboradorDto) {
    const resultado = await this.usuariosService.listarColaboradores(
      filtros.pagina,
      filtros.limite,
      filtros.busca,
      filtros.statusChamado,
    );
    // Uma query agrupada só pra TODOS os colaboradores desta página, em
    // vez do frontend pedir GET /usuarios/:id/chamados uma vez por linha
    // (ver comentário em ChamadosService.contarPorSolicitantes).
    const contagens = await this.chamadosService.contarPorSolicitantes(
      resultado.itens.map((usuario) => usuario.id),
    );
    const itens: ColaboradorListaResponseDto[] = resultado.itens.map(
      (usuario) => {
        const c = contagens.get(usuario.id) ?? {
          total: 0,
          abertos: 0,
          finalizados: 0,
        };
        return {
          ...mapUsuarioParaResposta(usuario),
          totalChamados: c.total,
          chamadosAbertos: c.abertos,
          chamadosFinalizados: c.finalizados,
        };
      },
    );
    return { ...resultado, itens };
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
    const resultado = await this.chamadosService.listarPorUsuario(
      id,
      undefined,
      1,
      SEM_LIMITE_PRATICO,
    );
    return resultado.itens.map(mapChamadoParaResposta);
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
