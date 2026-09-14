import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { LogAuditoria } from '../log-auditoria/entities/log-auditoria.entity';
import { AcaoAuditoria } from '../common/enums/acao-auditoria.enum';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { LogAcessoService } from '../log-acesso/log-acesso.service';
import { FiltroAcessoDto } from './dto/filtro-acesso.dto';
import { AcessoColaboradorResponseDto } from './dto/relatorio-acesso-response.dto';
import { AtividadeColaboradorResponseDto } from './dto/relatorio-atividade-response.dto';
import {
  ItemTempoAtendimentoDto,
  RelatorioTempoAtendimentoResponseDto,
} from './dto/relatorio-tempo-atendimento-response.dto';
import { CargaTecnicoResponseDto } from './dto/relatorio-carga-tecnicos-response.dto';
import {
  ChamadoReabertoDto,
  RelatorioReaberturasResponseDto,
  TecnicoReaberturasResponseDto,
} from './dto/relatorio-reaberturas-response.dto';
import { FiltroPeriodo, resolverPeriodo } from '../common/utils/periodo.util';

const DIAS_INATIVIDADE_PADRAO = 30;
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const MAXIMO_MAIS_DEMORADOS = 5;
const MINIMO_REABERTURAS_DESTAQUE = 2;

// ⚠️ DÍVIDA TÉCNICA CONHECIDA — ver também README.md.
// LogAuditoria não guarda o status anterior/novo em colunas estruturadas,
// só um `descricao` de texto pronto pra leitura humana (ex: 'Status
// alterado de "Na fila" para "Em atendimento"', montado em
// ChamadosService.atualizarStatus). Pra achar "quando este chamado entrou
// em atendimento/foi finalizado pela 1ª vez" sem um campo estruturado,
// comparamos o FINAL do texto contra as duas constantes abaixo — que
// precisam continuar batendo, caractere por caractere, com os valores de
// LABEL_STATUS[StatusChamado.ANDAMENTO]/LABEL_STATUS[StatusChamado.
// FINALIZADO] em chamados.service.ts. Se algum daqueles rótulos mudar sem
// atualizar aqui junto, os relatórios afetados (Tempo de Atendimento,
// Carga entre Técnicos) simplesmente param de encontrar transições novas,
// EM SILÊNCIO (sem erro) — os chamados afetados passam a cair nos
// contadores de "sem transição" como se nunca tivessem avançado.
// Seguro quanto a falso-positivo: REABERTURA (a única outra ação que
// mexe em status) nunca aponta pra ANDAMENTO nem FINALIZADO na máquina de
// estados atual (reabertura sempre vai de FINALIZADO -> PARADO), então
// filtrar por `acao = MUDANCA_STATUS` já exclui esse caso sem precisar
// checar o texto dela também.
// Solução definitiva, se algum dia vale a pena: adicionar colunas
// estruturadas `statusAnterior`/`statusNovo` (enum) em LogAuditoria — aí
// esta consulta vira um WHERE em coluna tipada, sem depender de texto.
const SUFIXO_TRANSICAO_PARA_ANDAMENTO = '"Em atendimento"';
const SUFIXO_TRANSICAO_PARA_FINALIZADO = '"Finalizado"';

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
    @InjectRepository(LogAuditoria)
    private readonly logAuditoriaRepository: Repository<LogAuditoria>,
    private readonly logAcessoService: LogAcessoService,
  ) {}

  private async listarColaboradores(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: { tipo: TipoUsuario.COLABORADOR },
      order: { email: 'ASC' },
    });
  }

  private async listarTecnicos(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: { tipo: TipoUsuario.TECNICO },
      order: { email: 'ASC' },
    });
  }

  // Busca, em lote, a primeira vez (MIN dataHora) que cada chamado da
  // lista teve uma transição MUDANCA_STATUS cujo texto termina com
  // `sufixo` — reaproveitado por relatorioTempoAtendimento (sufixo "Em
  // atendimento") e relatorioCargaTecnicos (sufixo "Finalizado"), ver
  // aviso de dívida técnica no topo do arquivo.
  private async buscarPrimeirasTransicoes(
    chamadoIds: number[],
    sufixo: string,
  ): Promise<Map<number, Date>> {
    const mapa = new Map<number, Date>();
    if (chamadoIds.length === 0) return mapa;

    const linhas = await this.logAuditoriaRepository
      .createQueryBuilder('log')
      .select('log.chamadoId', 'chamadoId')
      .addSelect('MIN(log.dataHora)', 'primeiraTransicao')
      .where('log.chamadoId IN (:...ids)', { ids: chamadoIds })
      .andWhere('log.acao = :acao', { acao: AcaoAuditoria.MUDANCA_STATUS })
      .andWhere('log.descricao LIKE :sufixo', { sufixo: `%${sufixo}` })
      .groupBy('log.chamadoId')
      .getRawMany<{ chamadoId: number; primeiraTransicao: Date }>();

    for (const linha of linhas) {
      mapa.set(linha.chamadoId, linha.primeiraTransicao);
    }
    return mapa;
  }

  // GET /admin/relatorios/acesso — último login de cada colaborador (via
  // LogAcessoService, ver comentário lá sobre a query agrupada) e um flag
  // de "inativo" calculado aqui a partir de `diasInatividade` (default 30).
  // Contas "aguardando cadastro" (senhaHash null) entram na lista mas nunca
  // vão ter um LogAcesso — aparecem como "nunca acessou", corretamente.
  async relatorioAcesso(
    filtros: FiltroAcessoDto,
  ): Promise<AcessoColaboradorResponseDto[]> {
    const diasInatividade = filtros.diasInatividade ?? DIAS_INATIVIDADE_PADRAO;
    const limiteMs = diasInatividade * MILISSEGUNDOS_POR_DIA;
    const agora = Date.now();

    const colaboradores = await this.listarColaboradores();
    const ultimosAcessos = await this.logAcessoService.buscarUltimosAcessos(
      colaboradores.map((c) => c.id),
    );

    return colaboradores.map((colaborador) => {
      const ultimoAcesso = ultimosAcessos.get(colaborador.id) ?? null;
      const inativo =
        ultimoAcesso === null ||
        agora - new Date(ultimoAcesso).getTime() > limiteMs;
      return {
        usuarioId: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email,
        ultimoAcesso,
        inativo,
      };
    });
  }

  // GET /admin/relatorios/atividade-chamados — quantos chamados cada
  // colaborador abriu no período (default últimos 30 dias, mesmo
  // resolverPeriodo do Dashboard) e a data do último. Quem abriu zero
  // aparece com totalChamados:0 — o frontend destaca esses separadamente,
  // não precisa de dois arrays diferentes aqui.
  async relatorioAtividadeChamados(
    filtros: FiltroPeriodo,
  ): Promise<AtividadeColaboradorResponseDto[]> {
    const { inicio, fim } = resolverPeriodo(filtros);
    const colaboradores = await this.listarColaboradores();
    const ids = colaboradores.map((c) => c.id);

    const contagens = new Map<
      number,
      { total: number; ultimoChamadoEm: Date }
    >();
    if (ids.length > 0) {
      const linhas = await this.chamadoRepository
        .createQueryBuilder('chamado')
        .select('chamado.solicitanteId', 'solicitanteId')
        .addSelect('COUNT(*)', 'total')
        .addSelect('MAX(chamado.dataAbertura)', 'ultimoChamadoEm')
        .where('chamado.solicitanteId IN (:...ids)', { ids })
        .andWhere('chamado.dataAbertura BETWEEN :inicio AND :fim', {
          inicio,
          fim,
        })
        .groupBy('chamado.solicitanteId')
        .getRawMany<{
          solicitanteId: number;
          total: string;
          ultimoChamadoEm: Date;
        }>();

      for (const linha of linhas) {
        contagens.set(linha.solicitanteId, {
          total: Number(linha.total),
          ultimoChamadoEm: linha.ultimoChamadoEm,
        });
      }
    }

    return colaboradores.map((colaborador) => {
      const dados = contagens.get(colaborador.id);
      return {
        usuarioId: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email,
        totalChamados: dados?.total ?? 0,
        ultimoChamadoEm: dados?.ultimoChamadoEm ?? null,
      };
    });
  }

  // GET /admin/relatorios/tempo-atendimento — ver o aviso grande no topo
  // do arquivo sobre a dependência de texto em LogAuditoria.descricao.
  async relatorioTempoAtendimento(
    filtros: FiltroPeriodo,
  ): Promise<RelatorioTempoAtendimentoResponseDto> {
    const { inicio, fim } = resolverPeriodo(filtros);

    const chamados = await this.chamadoRepository.find({
      where: { dataAbertura: Between(inicio, fim) },
      select: { id: true, titulo: true, dataAbertura: true },
      order: { dataAbertura: 'ASC' },
    });

    if (chamados.length === 0) {
      return {
        itens: [],
        mediaGeralMinutos: null,
        maisDemorados: [],
        totalSemTransicaoParaAtendimento: 0,
      };
    }

    const ids = chamados.map((c) => c.id);
    const primeirasTransicoes = await this.buscarPrimeirasTransicoes(
      ids,
      SUFIXO_TRANSICAO_PARA_ANDAMENTO,
    );

    const itens: ItemTempoAtendimentoDto[] = [];
    let totalSemTransicao = 0;

    for (const chamado of chamados) {
      const primeiraVezAndamento = primeirasTransicoes.get(chamado.id);
      if (!primeiraVezAndamento) {
        totalSemTransicao++;
        continue;
      }
      const tempoEsperaMinutos = Math.round(
        (new Date(primeiraVezAndamento).getTime() -
          chamado.dataAbertura.getTime()) /
          60_000,
      );
      itens.push({
        chamadoId: chamado.id,
        titulo: chamado.titulo,
        dataAbertura: chamado.dataAbertura,
        primeiraVezEmAtendimento: primeiraVezAndamento,
        tempoEsperaMinutos,
      });
    }

    const mediaGeralMinutos =
      itens.length > 0
        ? Math.round(
            itens.reduce((soma, item) => soma + item.tempoEsperaMinutos, 0) /
              itens.length,
          )
        : null;

    const maisDemorados = [...itens]
      .sort((a, b) => b.tempoEsperaMinutos - a.tempoEsperaMinutos)
      .slice(0, MAXIMO_MAIS_DEMORADOS);

    return {
      itens,
      mediaGeralMinutos,
      maisDemorados,
      totalSemTransicaoParaAtendimento: totalSemTransicao,
    };
  }

  // GET /admin/relatorios/carga-tecnicos — quantos chamados cada técnico
  // ficou responsável no período (dataAbertura, mesmo filtro de
  // tempo-atendimento) e o tempo médio até a PRIMEIRA finalização (mesmo
  // raciocínio de "primeira vez", não a mais recente — evita mascarar o
  // tempo real de resolução num caso de reabertura + refechamento
  // rápido). Chamados sem técnico responsável (ainda PARADO, ninguém
  // pegou) não entram — não tem a quem imputar essa carga. Todo técnico
  // aparece, mesmo com totalChamados:0 no período.
  async relatorioCargaTecnicos(
    filtros: FiltroPeriodo,
  ): Promise<CargaTecnicoResponseDto[]> {
    const { inicio, fim } = resolverPeriodo(filtros);
    const tecnicos = await this.listarTecnicos();

    const chamados = await this.chamadoRepository.find({
      where: { dataAbertura: Between(inicio, fim) },
      relations: { tecnicoResponsavel: true },
      select: {
        id: true,
        dataAbertura: true,
        tecnicoResponsavel: { id: true },
      },
    });
    const chamadosComTecnico = chamados.filter(
      (c): c is typeof c & { tecnicoResponsavel: Usuario } =>
        c.tecnicoResponsavel !== null,
    );

    const primeirasFinalizacoes = await this.buscarPrimeirasTransicoes(
      chamadosComTecnico.map((c) => c.id),
      SUFIXO_TRANSICAO_PARA_FINALIZADO,
    );

    const porTecnico = new Map<
      number,
      { total: number; duracoesMinutos: number[] }
    >();
    for (const chamado of chamadosComTecnico) {
      const tecnicoId = chamado.tecnicoResponsavel.id;
      const atual = porTecnico.get(tecnicoId) ?? {
        total: 0,
        duracoesMinutos: [],
      };
      atual.total++;
      const primeiraFinalizacao = primeirasFinalizacoes.get(chamado.id);
      if (primeiraFinalizacao) {
        atual.duracoesMinutos.push(
          Math.round(
            (new Date(primeiraFinalizacao).getTime() -
              chamado.dataAbertura.getTime()) /
              60_000,
          ),
        );
      }
      porTecnico.set(tecnicoId, atual);
    }

    return tecnicos.map((tecnico) => {
      const dados = porTecnico.get(tecnico.id);
      const duracoes = dados?.duracoesMinutos ?? [];
      const tempoMedioResolucaoMinutos =
        duracoes.length > 0
          ? Math.round(
              duracoes.reduce((soma, v) => soma + v, 0) / duracoes.length,
            )
          : null;
      return {
        tecnicoId: tecnico.id,
        nome: tecnico.nome,
        email: tecnico.email,
        totalChamados: dados?.total ?? 0,
        totalFinalizados: duracoes.length,
        tempoMedioResolucaoMinutos,
      };
    });
  }

  // GET /admin/relatorios/reaberturas — filtra pela data da REABERTURA em
  // si (não da abertura original do chamado): o que interessa aqui é "o
  // que aconteceu neste período", não "quando o chamado nasceu". Agrupado
  // por tecnicoResponsavel (quem resolveu, cuja resolução foi reaberta) —
  // decisão confirmada: o objetivo é identificar padrão de resolução
  // malfeita, não quem clicou em reabrir (normalmente o colaborador
  // insatisfeito, ver ChamadosService.atualizarStatus).
  async relatorioReaberturas(
    filtros: FiltroPeriodo,
  ): Promise<RelatorioReaberturasResponseDto> {
    const { inicio, fim } = resolverPeriodo(filtros);

    const linhas = await this.logAuditoriaRepository
      .createQueryBuilder('log')
      .select('log.chamadoId', 'chamadoId')
      .addSelect('COUNT(*)', 'totalReaberturas')
      .where('log.acao = :acao', { acao: AcaoAuditoria.REABERTURA })
      .andWhere('log.dataHora BETWEEN :inicio AND :fim', { inicio, fim })
      .groupBy('log.chamadoId')
      .getRawMany<{ chamadoId: number; totalReaberturas: string }>();

    if (linhas.length === 0) {
      return { porChamado: [], destaque: [], porTecnico: [] };
    }

    const chamados = await this.chamadoRepository.find({
      where: { id: In(linhas.map((l) => l.chamadoId)) },
      relations: { tecnicoResponsavel: true },
      select: {
        id: true,
        titulo: true,
        tecnicoResponsavel: { id: true, nome: true, email: true },
      },
    });
    const chamadoPorId = new Map(chamados.map((c) => [c.id, c]));

    const porChamado: ChamadoReabertoDto[] = linhas
      .map((linha) => {
        const chamado = chamadoPorId.get(linha.chamadoId);
        return {
          chamadoId: linha.chamadoId,
          titulo: chamado?.titulo ?? '(chamado não encontrado)',
          totalReaberturas: Number(linha.totalReaberturas),
          tecnicoResponsavelId: chamado?.tecnicoResponsavel?.id ?? null,
          tecnicoResponsavelNome: chamado?.tecnicoResponsavel?.nome ?? null,
        };
      })
      .sort((a, b) => b.totalReaberturas - a.totalReaberturas);

    const destaque = porChamado.filter(
      (c) => c.totalReaberturas >= MINIMO_REABERTURAS_DESTAQUE,
    );

    const porTecnicoMapa = new Map<number, TecnicoReaberturasResponseDto>();
    for (const linha of linhas) {
      const tecnico = chamadoPorId.get(linha.chamadoId)?.tecnicoResponsavel;
      if (!tecnico) continue;
      const atual = porTecnicoMapa.get(tecnico.id) ?? {
        tecnicoId: tecnico.id,
        nome: tecnico.nome,
        email: tecnico.email,
        totalReaberturas: 0,
      };
      atual.totalReaberturas += Number(linha.totalReaberturas);
      porTecnicoMapa.set(tecnico.id, atual);
    }
    const porTecnico = [...porTecnicoMapa.values()].sort(
      (a, b) => b.totalReaberturas - a.totalReaberturas,
    );

    return { porChamado, destaque, porTecnico };
  }
}
