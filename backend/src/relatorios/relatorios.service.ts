import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
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
import { FiltroPeriodo, resolverPeriodo } from '../common/utils/periodo.util';

const DIAS_INATIVIDADE_PADRAO = 30;
const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const MAXIMO_MAIS_DEMORADOS = 5;

// ⚠️ DÍVIDA TÉCNICA CONHECIDA — ver também README.md.
// LogAuditoria não guarda o status anterior/novo em colunas estruturadas,
// só um `descricao` de texto pronto pra leitura humana (ex: 'Status
// alterado de "Na fila" para "Em atendimento"', montado em
// ChamadosService.atualizarStatus). Pra achar "quando este chamado entrou
// em atendimento pela 1ª vez" sem um campo estruturado, comparamos o FINAL
// do texto contra esta constante — que precisa continuar batendo,
// caractere por caractere, com o valor de LABEL_STATUS[StatusChamado.
// ANDAMENTO] em chamados.service.ts. Se aquele rótulo mudar sem atualizar
// este aqui junto, o relatório de Tempo de Atendimento simplesmente para
// de encontrar transições novas, EM SILÊNCIO (sem erro) — os chamados
// afetados passam a cair em `totalSemTransicaoParaAtendimento` como se
// nunca tivessem entrado em atendimento.
// Seguro quanto a falso-positivo: REABERTURA (a única outra ação que
// mexe em status) nunca aponta pra ANDAMENTO na máquina de estados atual
// (reabertura sempre vai de FINALIZADO -> PARADO), então filtrar por
// `acao = MUDANCA_STATUS` já exclui esse caso sem precisar checar o texto
// dela também.
// Solução definitiva, se algum dia vale a pena: adicionar colunas
// estruturadas `statusAnterior`/`statusNovo` (enum) em LogAuditoria — aí
// esta consulta vira um WHERE em coluna tipada, sem depender de texto.
const SUFIXO_TRANSICAO_PARA_ANDAMENTO = '"Em atendimento"';

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
    const linhas = await this.logAuditoriaRepository
      .createQueryBuilder('log')
      .select('log.chamadoId', 'chamadoId')
      .addSelect('MIN(log.dataHora)', 'primeiraVezAndamento')
      .where('log.chamadoId IN (:...ids)', { ids })
      .andWhere('log.acao = :acao', { acao: AcaoAuditoria.MUDANCA_STATUS })
      .andWhere('log.descricao LIKE :sufixo', {
        sufixo: `%${SUFIXO_TRANSICAO_PARA_ANDAMENTO}`,
      })
      .groupBy('log.chamadoId')
      .getRawMany<{ chamadoId: number; primeiraVezAndamento: Date }>();

    const primeirasTransicoes = new Map<number, Date>();
    for (const linha of linhas) {
      primeirasTransicoes.set(linha.chamadoId, linha.primeiraVezAndamento);
    }

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
}
