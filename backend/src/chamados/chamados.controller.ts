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
import { ChamadosService } from './chamados.service';
import { ComentariosService } from '../comentarios/comentarios.service';
import { SolucoesConhecidasService } from '../solucoes-conhecidas/solucoes-conhecidas.service';
import { ObservadoresService } from '../observadores/observadores.service';
import { CriarChamadoDto } from './dto/criar-chamado.dto';
import { AbrirChamadoTecnicoDto } from './dto/abrir-chamado-tecnico.dto';
import { AtualizarStatusChamadoDto } from './dto/atualizar-status-chamado.dto';
import { AtualizarNivelChamadoDto } from './dto/atualizar-nivel-chamado.dto';
import { AtribuirChamadoDto } from './dto/atribuir-chamado.dto';
import { LogAuditoriaService } from '../log-auditoria/log-auditoria.service';
import { mapLogAuditoriaParaResposta } from '../log-auditoria/dto/log-auditoria-response.dto';
import { FiltrosChamadoDto } from './dto/filtros-chamado.dto';
import { BuscaChamadoDto } from './dto/busca-chamado.dto';
import { VerificarSemelhantesDto } from './dto/verificar-semelhantes.dto';
import { PaginacaoDto } from '../common/dto/paginacao.dto';
import { PeriodoChamadoDto } from './dto/periodo-chamado.dto';
import { MetricasChamadoDto } from './dto/metricas-chamado.dto';
import { mapChamadoParaResposta } from './dto/chamado-response.dto';
import { CriarComentarioDto } from '../comentarios/dto/criar-comentario.dto';
import { mapComentarioParaResposta } from '../comentarios/dto/comentario-response.dto';
import { AdicionarObservadorDto } from '../observadores/dto/adicionar-observador.dto';

// @UseGuards(JwtAuthGuard) na classe já exige token válido em toda rota
// deste controller — RolesGuard só entra depois, restringindo ainda mais
// algumas rotas específicas via @Roles(...) no método. A ORDEM importa:
// primeiro autentica (sabe QUEM é), depois autoriza (sabe se ELE pode).
@Controller('chamados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChamadosController {
  constructor(
    private readonly chamadosService: ChamadosService,
    private readonly comentariosService: ComentariosService,
    private readonly solucoesConhecidasService: SolucoesConhecidasService,
    private readonly observadoresService: ObservadoresService,
    private readonly logAuditoriaService: LogAuditoriaService,
  ) {}

  // "Central de Chamados" — visão completa, só TI. Paginado (ver
  // FiltrosChamadoDto extends PaginacaoDto) — `itens` mapeado, resto do
  // envelope ({ total, pagina, totalPaginas }) repassado como veio do
  // service.
  @Get()
  @Roles(TipoUsuario.TECNICO)
  async listarTodos(@Query() filtros: FiltrosChamadoDto) {
    const resultado = await this.chamadosService.listarTodos(filtros);
    return { ...resultado, itens: resultado.itens.map(mapChamadoParaResposta) };
  }

  // Sem @Roles: qualquer usuário autenticado pode ver os PRÓPRIOS chamados —
  // "próprio" aqui é garantido porque usamos `usuarioAtual.sub` (do token),
  // nunca um id vindo da query string.
  @Get('meus')
  async listarMeusChamados(
    @Query() filtros: BuscaChamadoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const resultado = await this.chamadosService.listarPorUsuario(
      usuarioAtual.sub,
      filtros.busca,
      filtros.pagina,
      filtros.limite,
      filtros.status,
    );
    return { ...resultado, itens: resultado.itens.map(mapChamadoParaResposta) };
  }

  // Precisa vir ANTES de @Get(':id') — senão "observando" seria capturado
  // como valor de :id e o ParseIntPipe rejeitaria com 400 antes de chegar
  // aqui (mesmo motivo pelo qual @Get('meus') também vem antes).
  //
  // Sem @Roles: qualquer usuário autenticado pode ver os chamados que
  // observa — "observando" aqui também é sempre `usuarioAtual.sub`, nunca
  // um id vindo de fora.
  @Get('observando')
  async listarObservando(
    @Query() filtros: PaginacaoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const resultado = await this.chamadosService.listarObservados(
      usuarioAtual.sub,
      filtros.pagina,
      filtros.limite,
    );
    return { ...resultado, itens: resultado.itens.map(mapChamadoParaResposta) };
  }

  // Chamado no MEIO do preenchimento do formulário "Abrir chamado" (ainda
  // não existe) — colaborador digitando categoria/descrição, avisando se
  // já tem algo parecido em aberto. Sem @Roles, mesmo motivo de /meus e
  // /observando: sempre pelos PRÓPRIOS chamados de quem está autenticado
  // (`usuarioAtual.sub`), nunca de outro colaborador. Precisa vir ANTES
  // de @Get(':id') pelo mesmo motivo de posicionamento das rotas acima.
  @Get('verificar-semelhantes')
  async verificarSemelhantes(
    @Query() filtros: VerificarSemelhantesDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    return this.chamadosService.buscarSemelhantesDoUsuario(
      usuarioAtual.sub,
      filtros.categoria,
      filtros.texto,
    );
  }

  // Motor genérico de agregação pro Dashboard TI configurável (ver
  // DashboardWidget) — precisa vir ANTES de @Get(':id') pelo mesmo motivo
  // de /meus e /observando acima: senão "metricas" seria capturado como
  // valor de :id e o ParseIntPipe rejeitaria com 400 antes de chegar aqui.
  @Get('metricas')
  @Roles(TipoUsuario.TECNICO)
  async obterMetricas(@Query() filtros: MetricasChamadoDto) {
    return this.chamadosService.obterMetricas(filtros);
  }

  // Carve-out do agrupamento por categoria + palavra-chave — não cabe no
  // motor genérico acima (ver ChamadosService.obterRepeticao). Mesmo
  // motivo de posicionamento que /metricas.
  @Get('repeticao')
  @Roles(TipoUsuario.TECNICO)
  async obterRepeticao(@Query() filtros: PeriodoChamadoDto) {
    return this.chamadosService.obterRepeticao(filtros);
  }

  @Get(':id')
  async buscarUm(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const chamado = await this.chamadosService.buscarDetalhado(
      id,
      usuarioAtual,
    );
    return mapChamadoParaResposta(chamado);
  }

  @Post()
  @Roles(TipoUsuario.COLABORADOR)
  async criar(
    @Body() dto: CriarChamadoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const chamado = await this.chamadosService.criar(dto, usuarioAtual.sub);
    return mapChamadoParaResposta(chamado);
  }

  // Técnico abre um chamado em nome de um colaborador (cenário "colega
  // ligou/pediu pessoalmente, sem passar pelo formulário ele mesmo"). O
  // colaborador informado em `dto.solicitanteId` vira o dono real do
  // chamado (aparece em Meus Chamados dele normalmente); `abertoPorTecnico`
  // guarda só a auditoria de quem criou — sempre o técnico do TOKEN, nunca
  // um valor vindo do corpo da requisição.
  @Post('tecnico')
  @Roles(TipoUsuario.TECNICO)
  async criarComoTecnico(
    @Body() dto: AbrirChamadoTecnicoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const chamado = await this.chamadosService.criarComoTecnico(
      dto,
      usuarioAtual.sub,
    );
    return mapChamadoParaResposta(chamado);
  }

  @Patch(':id/status')
  @Roles(TipoUsuario.TECNICO)
  async atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarStatusChamadoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const chamado = await this.chamadosService.atualizarStatus(
      id,
      dto,
      usuarioAtual,
    );
    return mapChamadoParaResposta(chamado);
  }

  // Define/troca/remove o técnico responsável manualmente — diferente de
  // PATCH /status (que só auto-atribui o próprio técnico logado), aqui
  // qualquer técnico pode escolher QUALQUER técnico da lista pra atender,
  // inclusive desatribuir (tecnicoId null). ChamadosService.atribuir valida
  // que o id informado é de fato um TECNICO.
  @Patch(':id/atribuir')
  @Roles(TipoUsuario.TECNICO)
  async atribuir(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtribuirChamadoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const chamado = await this.chamadosService.atribuir(id, dto, usuarioAtual);
    return mapChamadoParaResposta(chamado);
  }

  // Reclassificação manual de nível — corrige a sugestão automática quando
  // ela erra. Só TECNICO, e não é controle de acesso: o chamado continua
  // visível/assumível pelos dois técnicos, o nível é só uma etiqueta.
  @Patch(':id/nivel')
  @Roles(TipoUsuario.TECNICO)
  async reclassificarNivel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarNivelChamadoDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const chamado = await this.chamadosService.reclassificarNivel(
      id,
      dto,
      usuarioAtual,
    );
    return mapChamadoParaResposta(chamado);
  }

  // Adiciona um colaborador como "Cc" do chamado — ele passa a ter acesso
  // de leitura/comentário sem virar o solicitante. Validações (colaborador
  // ativo, não é o próprio solicitante, ainda não é observador) ficam em
  // ObservadoresService.adicionar.
  @Post(':id/observadores')
  @Roles(TipoUsuario.TECNICO)
  async adicionarObservador(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdicionarObservadorDto,
  ) {
    await this.observadoresService.adicionar(id, dto.usuarioId);
    const chamado = await this.chamadosService.buscarPorIdOuFalhar(id);
    return mapChamadoParaResposta(chamado);
  }

  @Delete(':id/observadores/:usuarioId')
  @Roles(TipoUsuario.TECNICO)
  async removerObservador(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    await this.observadoresService.remover(id, usuarioId);
    const chamado = await this.chamadosService.buscarPorIdOuFalhar(id);
    return mapChamadoParaResposta(chamado);
  }

  @Post(':id/comentarios')
  async criarComentario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarComentarioDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const comentario = await this.comentariosService.criar(
      id,
      dto,
      usuarioAtual,
    );
    return mapComentarioParaResposta(comentario);
  }

  @Get(':id/comentarios')
  async listarComentarios(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const comentarios = await this.comentariosService.listarPorChamado(
      id,
      usuarioAtual,
    );
    return comentarios.map(mapComentarioParaResposta);
  }

  // Só TECNICO: é o painel de atendimento quem usa isso, pra sugerir
  // soluções parecidas antes de começar a resolver do zero. Reaproveita
  // buscarPorIdOuFalhar (sem checagem de dono — quem já passou pelo
  // RolesGuard aqui é sempre técnico, então "chamado de outra pessoa" não
  // se aplica do mesmo jeito que se aplica pro lado colaborador).
  @Get(':id/solucoes-sugeridas')
  @Roles(TipoUsuario.TECNICO)
  async buscarSolucoesSugeridas(@Param('id', ParseIntPipe) id: number) {
    const chamado = await this.chamadosService.buscarPorIdOuFalhar(id);
    return this.solucoesConhecidasService.sugerirParaChamado(chamado);
  }

  // "Histórico de alterações" do painel de TI — só técnico, mesma razão de
  // /solucoes-sugeridas: quem já passou pelo RolesGuard aqui sempre tem
  // acesso a qualquer chamado, não precisa de checagem de dono.
  @Get(':id/logs')
  @Roles(TipoUsuario.TECNICO)
  async listarLogsAuditoria(@Param('id', ParseIntPipe) id: number) {
    await this.chamadosService.buscarPorIdOuFalhar(id);
    const logs = await this.logAuditoriaService.listarPorChamado(id);
    return logs.map(mapLogAuditoriaParaResposta);
  }
}
