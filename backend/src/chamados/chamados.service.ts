import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { TipoComentario } from '../common/enums/tipo-comentario.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, ILike, In, Not, Repository } from 'typeorm';
import { Chamado } from './entities/chamado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Comentario } from '../comentarios/entities/comentario.entity';
import { CriarChamadoDto } from './dto/criar-chamado.dto';
import { AbrirChamadoTecnicoDto } from './dto/abrir-chamado-tecnico.dto';
import { AtualizarStatusChamadoDto } from './dto/atualizar-status-chamado.dto';
import { AtualizarNivelChamadoDto } from './dto/atualizar-nivel-chamado.dto';
import { AtualizarPrioridadeChamadoDto } from './dto/atualizar-prioridade-chamado.dto';
import { AtualizarCategoriaChamadoDto } from './dto/atualizar-categoria-chamado.dto';
import { AtribuirChamadoDto } from './dto/atribuir-chamado.dto';
import { LogAuditoriaService } from '../log-auditoria/log-auditoria.service';
import { AcaoAuditoria } from '../common/enums/acao-auditoria.enum';
import { FiltrosChamadoDto } from './dto/filtros-chamado.dto';
import { PeriodoChamadoDto } from './dto/periodo-chamado.dto';
import { MetricasChamadoDto } from './dto/metricas-chamado.dto';
import { MetricaItemResponseDto } from './dto/metrica-item-response.dto';
import { StatusChamado } from '../common/enums/status-chamado.enum';
import { NivelChamado } from '../common/enums/nivel-chamado.enum';
import { PrioridadeChamado } from '../common/enums/prioridade-chamado.enum';
import { AgruparPor } from '../common/enums/agrupar-por.enum';
import { TipoMetrica } from '../common/enums/tipo-metrica.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { SolucoesConhecidasService } from '../solucoes-conhecidas/solucoes-conhecidas.service';
import { CategoriasService } from '../categorias/categorias.service';
import { PalavrasChaveN3Service } from '../palavras-chave-n3/palavras-chave-n3.service';
import { ObservadoresService } from '../observadores/observadores.service';
import { EmailService } from '../email/email.service';
import { calcularNivelSugerido } from './nivel-triagem.util';
import { agruparChamadosRepetidos, GrupoRepetido } from './estatisticas.util';
import {
  extrairPalavrasChave,
  contarPalavrasEmComum,
} from '../solucoes-conhecidas/palavras-chave.util';
import {
  calcularPaginacao,
  montarRespostaPaginada,
  RespostaPaginadaDto,
} from '../common/dto/resposta-paginada.dto';
import { resolverPeriodo } from '../common/utils/periodo.util';

// Relações que toda consulta de Chamado precisa trazer junto — sem isso o
// TypeORM devolveria só os ids (solicitanteId/tecnicoResponsavelId) e o
// mapeamento pra ChamadoResponseDto (que expõe nome/cargo etc.) quebraria.
// `observadores.usuario` também entra aqui: além de aparecer na resposta
// (lista de "Cc"), buscarDetalhado usa essa relação já carregada pra
// decidir se um colaborador que não é o solicitante ainda assim tem acesso
// por ser observador.
const RELACOES_PADRAO = {
  solicitante: true,
  tecnicoResponsavel: true,
  abertoPorTecnico: true,
  solucaoConhecida: true,
  observadores: { usuario: true },
};

// Usado só dentro de atualizarStatus, para CARREGAR o chamado que vamos
// mutar e salvar em seguida. Não inclui `solucaoConhecida` de propósito: se
// carregássemos essa relação aqui, o TypeORM guardaria "solucaoConhecida:
// null" no objeto (chamado ainda não tinha solução no momento da leitura) e,
// ao chamar save() logo depois de já termos inserido a nova SolucaoConhecida
// em paralelo, ele tentaria "desassociar" essa relação (UPDATE ... SET
// chamadoId = NULL), violando a constraint NOT NULL. Ler sem essa relação
// aqui evita o problema; a resposta final ainda vem completa porque
// buscarPorIdOuFalhar (com RELACOES_PADRAO) é chamado de novo no final,
// como uma leitura fresca, sem essa armadilha de save().
const RELACOES_PARA_ATUALIZAR = { solicitante: true, tecnicoResponsavel: true };

// Rótulo legível de status pro texto do log de auditoria (ex: 'Status
// alterado de "Na fila" para "Em atendimento"') — só existe aqui, separado
// do `label` de CORES_STATUS no frontend, porque o backend nunca importa
// nada do frontend; é uma pequena duplicação intencional, não uma fonte de
// verdade nova (o enum StatusChamado continua sendo isso).
const LABEL_STATUS: Record<StatusChamado, string> = {
  [StatusChamado.PARADO]: 'Na fila',
  [StatusChamado.ANDAMENTO]: 'Em atendimento',
  [StatusChamado.FINALIZADO]: 'Finalizado',
};

// Mesmo raciocínio de LABEL_STATUS acima, pro texto do log de auditoria de
// ChamadosService.atualizarPrioridade.
const LABEL_PRIORIDADE: Record<PrioridadeChamado, string> = {
  [PrioridadeChamado.BAIXA]: 'Baixa',
  [PrioridadeChamado.MEDIA]: 'Média',
  [PrioridadeChamado.ALTA]: 'Alta',
};

// O "número do chamado" exibido no front (#1000+id, ver
// frontend/src/utils/numeroChamado.js) nunca é gravado no banco — é sempre
// derivado do id na hora de mostrar OU, aqui, na hora de buscar de volta.
// Só tenta interpretar `busca` como número quando ela é puramente dígitos
// (com ou sem "#" na frente); qualquer outra coisa (texto, "#12a" etc.)
// devolve null e a busca segue só pelo caminho de texto livre.
function extrairIdDoNumeroChamado(busca: string): number | null {
  const semHash = busca.trim().replace(/^#/, '');
  if (!/^\d+$/.test(semHash)) return null;
  const id = parseInt(semHash, 10) - 1000;
  return id > 0 ? id : null;
}

// Só os 4 agrupamentos "por enum" de GET /chamados/metricas (solicitante e
// tecnicoResponsavel são "por pessoa", tratados à parte — ver
// agruparPorPessoa). Os valores de AgruparPor foram escolhidos justamente
// pra baterem com o nome do campo correspondente em Chamado, mas indexar
// `chamado[agruparPor]` dinamicamente exigiria `as any` pra escapar do
// TypeScript — este mapa explícito evita isso sem perder a generalidade.
type AgruparPorEnum =
  | AgruparPor.NIVEL
  | AgruparPor.CATEGORIA
  | AgruparPor.STATUS
  | AgruparPor.PRIORIDADE;

const EXTRATOR_POR_AGRUPAMENTO: Record<
  AgruparPorEnum,
  (chamado: Chamado) => string
> = {
  [AgruparPor.NIVEL]: (chamado) => chamado.nivel,
  // .categoria agora é a entity (relação eager) — o agrupamento continua
  // sendo por NOME, mesmo formato de string que sempre foi.
  [AgruparPor.CATEGORIA]: (chamado) => chamado.categoria.nome,
  [AgruparPor.STATUS]: (chamado) => chamado.status,
  [AgruparPor.PRIORIDADE]: (chamado) => chamado.prioridade,
};

// Valores possíveis de cada enum, na ordem de declaração — usado só quando
// tipo=contagem, pra zero-preencher os grupos sem nenhum chamado no
// período (о gráfico de barras do frontend nunca fica com uma barra
// faltando, mesmo raciocínio que `porNivel` já tinha antes desta rota
// virar genérica). CATEGORIA fica de fora deste mapa estático de propósito
// — não é mais um enum fixo, a lista de categorias ativas é buscada no
// banco em obterMetricas() (ver CategoriasService.listarNomesAtivos).
type AgruparPorEnumEstatico = Exclude<AgruparPorEnum, AgruparPor.CATEGORIA>;
const VALORES_POR_AGRUPAMENTO: Record<AgruparPorEnumEstatico, string[]> = {
  [AgruparPor.NIVEL]: Object.values(NivelChamado),
  [AgruparPor.STATUS]: Object.values(StatusChamado),
  [AgruparPor.PRIORIDADE]: Object.values(PrioridadeChamado),
};

const LIMITE_RANKING_PADRAO = 10;

// Mesmo teto de solucoes-conhecidas.service.ts (MAXIMO_SUGESTOES) — um
// aviso com muitos links vira ruído em vez de ajuda.
const MAXIMO_SEMELHANTES = 3;

@Injectable()
export class ChamadosService {
  private readonly logger = new Logger(ChamadosService.name);

  constructor(
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
    // Só pra gravar o comentário automático de auditoria em
    // reclassificarNivel (ver ali) — não passa pelo ComentariosService de
    // propósito, ver comentário em ChamadosModule.
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
    // ChamadosModule importa SolucoesConhecidasModule (que exporta esse
    // service) só para este único uso: ao finalizar um chamado, precisamos
    // criar o registro de solução — a regra "toda finalização gera uma
    // SolucaoConhecida" fica aqui, mas SALVAR essa entidade é
    // responsabilidade do módulo dela, não deste.
    private readonly solucoesConhecidasService: SolucoesConhecidasService,
    // Usado só em listarObservados (GET /chamados/observando) — o resto do
    // acesso a ChamadoObservador (checagem de IDOR) acontece sem essa
    // injeção, direto via a relação `observadores` já carregada por
    // RELACOES_PADRAO, ver buscarDetalhado.
    private readonly observadoresService: ObservadoresService,
    // Só leitura — usado em criarComoTecnico pra validar que o
    // solicitanteId informado é mesmo um colaborador com conta ativa antes
    // de abrir o chamado em nome dele. Injetado direto (em vez de importar
    // UsuariosModule) porque UsuariosModule já importa ChamadosModule (pra
    // GET /usuarios/:id/chamados) — importar de volta criaria um ciclo.
    // Mesma solução que ObservadoresService já usa pra essa mesma checagem.
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    // Registra o log de auditoria em atualizarStatus, atribuir e
    // reclassificarNivel — nunca em rota de leitura (ver
    // LogAuditoriaService.registrar).
    private readonly logAuditoriaService: LogAuditoriaService,
    // Notificações por e-mail (chamado novo, mudança de status) — o
    // EmailService só garante que falha de ENVIO (SMTP) nunca propaga pra
    // cá; falha ao MONTAR a mensagem (ex: relação não carregada) ainda
    // pode lançar antes disso, por isso as chamadas abaixo levam .catch()
    // próprio (ver criar/atualizarStatus).
    private readonly emailService: EmailService,
    // Resolve o `categoria` (nome, string) do DTO numa Categoria de verdade
    // — nunca aceita um nome que não existe ou está desativado (ver
    // criar()) — e fornece a lista de nomes ativos pra zero-preencher o
    // gráfico "Distribuição por categoria" (ver obterMetricas).
    private readonly categoriasService: CategoriasService,
    // Fornece a lista de palavras ativas pra calcularNivelSugerido
    // sobrepor pra N3 independente do nivelPadrao da categoria — ver
    // criar() e nivel-triagem.util.ts.
    private readonly palavrasChaveN3Service: PalavrasChaveN3Service,
  ) {}

  async criar(
    dto: CriarChamadoDto,
    solicitanteId: number,
    abertoPorTecnicoId: number | null = null,
  ): Promise<Chamado> {
    const categoria = await this.categoriasService.buscarAtivaPorNomeOuFalhar(
      dto.categoria,
    );
    const palavrasChaveN3 = await this.palavrasChaveN3Service.listarAtivas();
    const chamado = this.chamadoRepository.create({
      titulo: dto.titulo,
      descricao: dto.descricao,
      mensagemErro: dto.mensagemErro ?? null,
      categoria,
      prioridade: dto.prioridade,
      imagensUrls: dto.imagensUrls ?? [],
      anydeskId: dto.anydeskId ?? null,
      nivel: calcularNivelSugerido(
        categoria,
        dto.descricao,
        dto.mensagemErro ?? null,
        palavrasChaveN3.map((p) => p.palavra),
      ),
      status: StatusChamado.PARADO,
      // Atribuir só `{ id }` (em vez de buscar o Usuario inteiro) é um atalho
      // válido do TypeORM: ele entende que é uma referência de relação e
      // grava só o id na coluna solicitanteId, sem precisar de um SELECT
      // extra aqui — o `id` vem do token (JwtPayload.sub) no fluxo normal,
      // ou de `solicitanteId` já validado em criarComoTecnico no fluxo do
      // técnico — nunca de um campo cru e não-validado do body.
      solicitante: { id: solicitanteId } as Usuario,
      abertoPorTecnico: abertoPorTecnicoId ? { id: abertoPorTecnicoId } : null,
    });
    const salvo = await this.chamadoRepository.save(chamado);
    const criado = await this.buscarPorIdOuFalhar(salvo.id);
    // Fire-and-forget de propósito: notificar os técnicos por e-mail não é
    // parte do contrato de "abrir um chamado" — o chamado já está salvo e a
    // resposta não deve esperar (nem falhar) por causa do envio. O .catch
    // aqui é a rede de segurança: enviarComSeguranca já trata falha do
    // SMTP em si, mas se a MONTAGEM do e-mail lançar antes disso (ex: um
    // relacionamento não carregado), sem o .catch essa promise rejeitada
    // não tem quem a trate — e uma promise rejeitada sem handler derruba o
    // processo Node inteiro, não só essa notificação.
    void this.emailService
      .enviarNotificacaoChamadoNovo(criado)
      .catch((erro: unknown) =>
        this.logger.error('Falha ao notificar chamado novo por e-mail', erro),
      );
    return criado;
  }

  // POST /chamados/tecnico — técnico abre um chamado em nome de um
  // colaborador (cenário "colega ligou/pediu pessoalmente"). Reaproveita
  // `criar()` inteiro (mesmo cálculo de nível, mesmo status inicial) só
  // trocando QUEM é o solicitante e registrando QUEM criou de fato.
  async criarComoTecnico(
    dto: AbrirChamadoTecnicoDto,
    tecnicoId: number,
  ): Promise<Chamado> {
    const solicitante = await this.usuarioRepository.findOne({
      where: { id: dto.solicitanteId },
    });
    // `senhaHash === null` é conta resetada (aguardando novo Primeiro
    // Acesso) — mesma checagem que ObservadoresService.adicionar já faz
    // pra "colaborador ativo", aplicada aqui pelo mesmo motivo: não faz
    // sentido abrir um chamado em nome de um e-mail de cargo que está sem
    // dono no momento.
    if (
      !solicitante ||
      solicitante.tipo !== TipoUsuario.COLABORADOR ||
      solicitante.senhaHash === null
    ) {
      throw new BadRequestException(
        'Só é possível abrir um chamado em nome de um colaborador com conta ativa',
      );
    }

    return this.criar(dto, dto.solicitanteId, tecnicoId);
  }

  // Compartilhado por listarTodos (GET /chamados, TECNICO) e
  // listarPorUsuario (GET /chamados/meus, qualquer autenticado) — mesma
  // lógica de busca por texto livre nos dois casos, só variando o `base`
  // (filtros de técnico num caso, `solicitante: { id }` no outro).
  private construirWhereComBusca(
    base: FindOptionsWhere<Chamado>,
    busca?: string,
  ): FindOptionsWhere<Chamado> | FindOptionsWhere<Chamado>[] {
    const termo = busca?.trim();
    if (!termo) return base;

    // Array de `where` = OR entre os elementos (cada um já herda os
    // filtros de `base` via spread, então eles continuam valendo como AND
    // de cada ramo do OR) — é assim que o TypeORM expressa "(base) AND
    // (titulo ILIKE ... OR descricao ILIKE ... OR id = ...)" sem precisar
    // de QueryBuilder pra este caso simples. ILike (não Like) — Postgres
    // resolve o "case-insensitive" nativamente, mesmo padrão já usado em
    // UsuariosService.listarColaboradores; Like aqui fazia "testando" não
    // encontrar nenhum chamado "Testando", só o "T" maiúsculo exato.
    const where: FindOptionsWhere<Chamado>[] = [
      { ...base, titulo: ILike(`%${termo}%`) },
      { ...base, descricao: ILike(`%${termo}%`) },
    ];
    const idDoNumero = extrairIdDoNumeroChamado(termo);
    if (idDoNumero !== null) where.push({ ...base, id: idDoNumero });
    return where;
  }

  // Contagem por status respeitando nível/categoria/busca, mas SEM aplicar
  // o filtro de status em si — os 4 cards de resumo do topo da Central de
  // Chamados (ITDashboard.jsx) precisam continuar corretos mesmo com uma
  // aba de status específica selecionada (iam pra 0 os outros 3 senão), e
  // agora que a listagem principal é paginada, também não dá mais pra
  // derivar isso de `chamados.length`/`.filter()` sobre só os itens da
  // página atual. 3 contagens pequenas em paralelo em vez de um só GROUP
  // BY: mais simples de reaproveitar construirWhereComBusca, que já
  // trabalha no formato de `where` do Repository, não do QueryBuilder.
  private async contarPorStatus(
    filtros: Pick<FiltrosChamadoDto, 'nivel' | 'categoria' | 'busca'>,
  ): Promise<Record<StatusChamado, number>> {
    const base: FindOptionsWhere<Chamado> = {};
    if (filtros.nivel) base.nivel = filtros.nivel;
    if (filtros.categoria) base.categoria = { nome: filtros.categoria };

    const entradas = await Promise.all(
      Object.values(StatusChamado).map(async (status) => {
        const total = await this.chamadoRepository.count({
          where: this.construirWhereComBusca(
            { ...base, status },
            filtros.busca,
          ),
        });
        return [status, total] as const;
      }),
    );
    return Object.fromEntries(entradas) as Record<StatusChamado, number>;
  }

  async listarTodos(filtros: FiltrosChamadoDto): Promise<
    RespostaPaginadaDto<Chamado> & {
      contagensPorStatus: Record<StatusChamado, number>;
    }
  > {
    // Monta o `where` só com os filtros que realmente vieram — diferente de
    // versões antigas do TypeORM, esta aqui não ignora mais chaves com
    // valor `undefined` sozinha (lança erro em vez disso), então não dá
    // pra simplesmente passar `{ status: filtros.status, ... }` quando um
    // filtro não foi enviado na query string.
    const base: FindOptionsWhere<Chamado> = {};
    if (filtros.status) base.status = filtros.status;
    if (filtros.nivel) base.nivel = filtros.nivel;
    if (filtros.categoria) base.categoria = { nome: filtros.categoria };

    const { pagina, limite, skip } = calcularPaginacao(
      filtros.pagina,
      filtros.limite,
    );
    const [[chamados, total], contagensPorStatus] = await Promise.all([
      this.chamadoRepository.findAndCount({
        where: this.construirWhereComBusca(base, filtros.busca),
        relations: RELACOES_PADRAO,
        order: { dataAbertura: 'DESC' },
        skip,
        take: limite,
      }),
      this.contarPorStatus(filtros),
    ]);
    return {
      ...montarRespostaPaginada(chamados, total, pagina, limite),
      contagensPorStatus,
    };
  }

  // `status`, quando informado, restringe a UMA coluna — é o que permite
  // MyTickets.jsx paginar Parado/Em andamento/Finalizado de forma
  // independente (cada coluna com seu próprio "carregar mais", sem puxar
  // as outras junto). Sem `status`, `busca` continua cobrindo os 3 de uma
  // vez (comportamento original, mantido pra quem não precisa das colunas
  // separadas).
  //
  // `pagina`/`limite` ausentes = sem paginação de verdade (usado por
  // GET /usuarios/:id/chamados, que passa um limite bem alto de propósito
  // — ver UsuariosController — porque ITUsers.jsx soma esses chamados pra
  // mostrar "total/abertos/finalizados" por colaborador, e paginar aquilo
  // silenciosamente deixaria a contagem errada). Só GET /chamados/meus
  // (ChamadosController.listarMeusChamados) passa os dois de verdade.
  async listarPorUsuario(
    usuarioId: number,
    busca?: string,
    pagina?: number,
    limite?: number,
    status?: StatusChamado,
  ): Promise<RespostaPaginadaDto<Chamado>> {
    const base: FindOptionsWhere<Chamado> = { solicitante: { id: usuarioId } };
    if (status) base.status = status;
    const paginacao = calcularPaginacao(pagina, limite);
    const [chamados, total] = await this.chamadoRepository.findAndCount({
      where: this.construirWhereComBusca(base, busca),
      relations: RELACOES_PADRAO,
      order: { dataAbertura: 'DESC' },
      skip: paginacao.skip,
      take: paginacao.limite,
    });
    return montarRespostaPaginada(
      chamados,
      total,
      paginacao.pagina,
      paginacao.limite,
    );
  }

  // Contagem de chamados (total/abertos/finalizados) de VÁRIOS solicitantes
  // de uma vez, numa query GROUP BY só — usado por UsuariosController pra
  // montar os cards de "Colaboradores" sem precisar de uma chamada GET
  // /usuarios/:id/chamados por linha da lista (era exatamente esse padrão
  // N+1 que, com 20+ colaboradores na página, gerava requisição de sobra
  // suficiente pra estourar o rate limit global só de abrir a tela — ver
  // README/histórico do bug). Mesmo padrão de query agrupada já usado em
  // AvisosService (contagem de leitores) e ForumService (contagem de
  // comentários).
  async contarPorSolicitantes(
    solicitanteIds: number[],
  ): Promise<
    Map<number, { total: number; abertos: number; finalizados: number }>
  > {
    const mapa = new Map<
      number,
      { total: number; abertos: number; finalizados: number }
    >();
    if (solicitanteIds.length === 0) return mapa;

    const linhas = await this.chamadoRepository
      .createQueryBuilder('chamado')
      .select('chamado.solicitanteId', 'solicitanteId')
      .addSelect('chamado.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .where('chamado.solicitanteId IN (:...ids)', { ids: solicitanteIds })
      .groupBy('chamado.solicitanteId')
      .addGroupBy('chamado.status')
      .getRawMany<{
        solicitanteId: number;
        status: StatusChamado;
        total: string;
      }>();

    for (const linha of linhas) {
      const atual = mapa.get(linha.solicitanteId) ?? {
        total: 0,
        abertos: 0,
        finalizados: 0,
      };
      const quantidade = Number(linha.total);
      atual.total += quantidade;
      if (linha.status === StatusChamado.FINALIZADO) {
        atual.finalizados += quantidade;
      } else {
        atual.abertos += quantidade;
      }
      mapa.set(linha.solicitanteId, atual);
    }
    return mapa;
  }

  // GET /chamados/verificar-semelhantes — chamado no MEIO do preenchimento
  // do formulário "Abrir chamado" (colaborador ainda digitando, chamado
  // nem existe ainda), pra avisar "você já tem algo parecido em aberto"
  // antes de duplicar. Deliberadamente DIFERENTE de
  // solucoes-sugeridas: aquela é TECNICO-only, opera sobre um chamado JÁ
  // criado, e sugere SOLUÇÕES resolvidas de qualquer colaborador; esta
  // aqui é aberta a qualquer autenticado, roda ANTES de criar, e só olha
  // pros PRÓPRIOS chamados ainda abertos (nunca de outro colaborador —
  // não faz sentido avisar alguém sobre o chamado de outra pessoa, que
  // ele nem tem acesso pra ver).
  async buscarSemelhantesDoUsuario(
    usuarioId: number,
    categoria: string,
    texto: string,
  ): Promise<Pick<Chamado, 'id' | 'titulo' | 'status'>[]> {
    const candidatos = await this.chamadoRepository.find({
      where: {
        solicitante: { id: usuarioId },
        categoria: { nome: categoria },
        status: Not(StatusChamado.FINALIZADO),
      },
      select: { id: true, titulo: true, descricao: true, status: true },
    });
    if (candidatos.length === 0) return [];

    const palavrasDoTexto = extrairPalavrasChave(texto);

    return (
      candidatos
        .map((chamado) => ({
          chamado,
          pontuacao: contarPalavrasEmComum(
            palavrasDoTexto,
            extrairPalavrasChave(`${chamado.titulo} ${chamado.descricao}`),
          ),
        }))
        // Mesma regra de solucoes-sugeridas: só "mesma categoria" não basta
        // sozinho, precisa ter pelo menos uma palavra de assunto em comum.
        .filter((item) => item.pontuacao > 0)
        .sort((a, b) => b.pontuacao - a.pontuacao)
        .slice(0, MAXIMO_SEMELHANTES)
        .map(({ chamado }) => ({
          id: chamado.id,
          titulo: chamado.titulo,
          status: chamado.status,
        }))
    );
  }

  // GET /chamados/observando — chamados onde o usuário é observador
  // ("Cc"), NUNCA misturado com /chamados/meus (solicitante): são duas
  // listas conceitualmente diferentes, mesmo que o mesmo usuário apareça
  // em ambas pra chamados diferentes.
  async listarObservados(
    usuarioId: number,
    pagina?: number,
    limite?: number,
  ): Promise<RespostaPaginadaDto<Chamado>> {
    const ids =
      await this.observadoresService.listarChamadoIdsObservados(usuarioId);
    const paginacao = calcularPaginacao(pagina, limite);
    if (ids.length === 0) {
      return montarRespostaPaginada([], 0, paginacao.pagina, paginacao.limite);
    }

    const [chamados, total] = await this.chamadoRepository.findAndCount({
      where: { id: In(ids) },
      relations: RELACOES_PADRAO,
      order: { dataAbertura: 'DESC' },
      skip: paginacao.skip,
      take: paginacao.limite,
    });
    return montarRespostaPaginada(
      chamados,
      total,
      paginacao.pagina,
      paginacao.limite,
    );
  }

  // GET /chamados/metricas — motor genérico de agregação pro Dashboard TI
  // configurável. Qualquer combinação de agruparPor + tipo passa por aqui;
  // adicionar uma métrica nova (ex: "contagem por prioridade") não pede
  // código novo, só um DashboardWidget novo apontando pra essa combinação.
  async obterMetricas(
    filtros: MetricasChamadoDto,
  ): Promise<MetricaItemResponseDto[]> {
    const { inicio, fim } = resolverPeriodo(filtros);
    const chamados = await this.buscarChamadosNoPeriodo(inicio, fim);

    if (
      filtros.agruparPor === AgruparPor.SOLICITANTE ||
      filtros.agruparPor === AgruparPor.TECNICO_RESPONSAVEL
    ) {
      return this.agruparPorPessoa(
        chamados,
        filtros.agruparPor,
        filtros.tipo,
        filtros.limite,
      );
    }

    // CATEGORIA não tem mais uma lista fixa de valores (era Object.values
    // do enum) — busca as categorias ATIVAS no banco só quando precisa
    // zero-preencher (tipo=contagem); ranking não usa isso, então não vale
    // a pena buscar à toa nesse caso.
    const valoresParaZerar =
      filtros.agruparPor === AgruparPor.CATEGORIA
        ? filtros.tipo === TipoMetrica.CONTAGEM
          ? await this.categoriasService.listarNomesAtivos()
          : []
        : VALORES_POR_AGRUPAMENTO[filtros.agruparPor];

    return this.agruparPorEnum(
      chamados,
      filtros.agruparPor,
      filtros.tipo,
      filtros.limite,
      valoresParaZerar,
    );
  }

  // GET /chamados/repeticao — carve-out do que antes vivia junto com as
  // outras métricas: agrupamento por categoria + palavra-chave da
  // descrição, lógica própria demais pra caber no motor genérico acima
  // (ver estatisticas.util.ts). Continua um widget "fixo" no catálogo,
  // não removível — ver DashboardWidgetsService.
  async obterRepeticao(filtros: PeriodoChamadoDto): Promise<GrupoRepetido[]> {
    const { inicio, fim } = resolverPeriodo(filtros);
    const chamados = await this.buscarChamadosNoPeriodo(inicio, fim);

    return agruparChamadosRepetidos(
      chamados.map((chamado) => ({
        categoria: chamado.categoria.nome,
        descricao: chamado.descricao,
        mensagemErro: chamado.mensagemErro,
      })),
    );
  }

  private async buscarChamadosNoPeriodo(
    inicio: Date,
    fim: Date,
  ): Promise<Chamado[]> {
    return this.chamadoRepository.find({
      where: { dataAbertura: Between(inicio, fim) },
      // solicitante: usado por agruparPorPessoa (agruparPor=solicitante) e
      // por obterRepeticao (rótulo não usa isso, mas manter uma única forma
      // de buscar evita duas versões quase iguais desta query). tecnicoResponsavel:
      // usado por agruparPorPessoa (agruparPor=tecnicoResponsavel) — antes
      // desta rota virar genérica, essa relação não precisava ser carregada
      // aqui.
      relations: { solicitante: true, tecnicoResponsavel: true },
    });
  }

  private agruparPorEnum(
    chamados: Chamado[],
    agruparPor: AgruparPorEnum,
    tipo: TipoMetrica,
    limite: number | undefined,
    valoresParaZerar: string[],
  ): MetricaItemResponseDto[] {
    const extrair = EXTRATOR_POR_AGRUPAMENTO[agruparPor];
    const contagem = new Map<string, number>();
    for (const chamado of chamados) {
      const chave = extrair(chamado);
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }

    if (tipo === TipoMetrica.CONTAGEM) {
      return valoresParaZerar.map((chave) => ({
        chave,
        rotulo: chave,
        total: contagem.get(chave) ?? 0,
      }));
    }

    return [...contagem.entries()]
      .map(([chave, total]) => ({ chave, rotulo: chave, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limite ?? LIMITE_RANKING_PADRAO);
  }

  private agruparPorPessoa(
    chamados: Chamado[],
    agruparPor: AgruparPor.SOLICITANTE | AgruparPor.TECNICO_RESPONSAVEL,
    tipo: TipoMetrica,
    limite: number | undefined,
  ): MetricaItemResponseDto[] {
    const contagem = new Map<number, { rotulo: string; total: number }>();
    for (const chamado of chamados) {
      const pessoa =
        agruparPor === AgruparPor.SOLICITANTE
          ? chamado.solicitante
          : chamado.tecnicoResponsavel;
      // tecnicoResponsavel pode ser null (chamado ainda parado, ninguém
      // assumiu) — não faz sentido um bucket "sem técnico" num ranking de
      // atendimento, então esses chamados ficam de fora deste agrupamento.
      if (!pessoa) continue;

      const existente = contagem.get(pessoa.id);
      if (existente) {
        existente.total++;
      } else {
        // Nome nulo = conta resetada (ver Usuario.nome) — mesmo fallback
        // "—" que o resto do app já usa pra esse caso.
        contagem.set(pessoa.id, { rotulo: pessoa.nome ?? '—', total: 1 });
      }
    }

    const itens = [...contagem.entries()]
      .map(([chave, { rotulo, total }]) => ({ chave, rotulo, total }))
      .sort((a, b) => b.total - a.total);

    // "Contagem por pessoa" não tem um universo fixo de valores pra
    // zero-preencher (diferente de nivel/categoria/status/prioridade) —
    // devolve a lista inteira, sem cortar. "Ranking" corta em `limite`.
    if (tipo === TipoMetrica.CONTAGEM) return itens;
    return itens.slice(0, limite ?? LIMITE_RANKING_PADRAO);
  }

  // Resolve o período de GET /chamados/metricas e /chamados/repeticao: cada
  // ponta (início/fim) tem seu próprio default, resolvida de forma
  // independente — ausência de dataFim vira "hoje"; ausência de dataInicio
  // vira "dataFim - 29 dias" (janela de 30 dias incluindo o dia final).

  async buscarPorIdOuFalhar(id: number): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id },
      relations: RELACOES_PADRAO,
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');
    return chamado;
  }

  // Usado pela rota pública GET /chamados/:id — mesma checagem de dono que
  // ComentariosService faz para os comentários, aplicada aqui ao chamado em
  // si: sem isso, um colaborador autenticado poderia ler qualquer chamado só
  // sabendo o id (IDOR), mesmo sendo de outro colaborador. "Dono de acesso
  // legítimo" inclui o solicitante E qualquer observador ("Cc") do chamado
  // — checado em memória contra `chamado.observadores`, já carregado por
  // RELACOES_PADRAO, sem precisar de uma query extra aqui.
  async buscarDetalhado(
    id: number,
    usuarioAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.buscarPorIdOuFalhar(id);
    const ehSolicitante = chamado.solicitante.id === usuarioAtual.sub;
    const ehObservador = chamado.observadores.some(
      (observador) => observador.usuario.id === usuarioAtual.sub,
    );
    const ehColaboradorSemAcesso =
      usuarioAtual.tipo === TipoUsuario.COLABORADOR &&
      !ehSolicitante &&
      !ehObservador;
    if (ehColaboradorSemAcesso) {
      throw new ForbiddenException(
        'Você só pode acessar chamados que você mesmo abriu ou está observando',
      );
    }
    return chamado;
  }

  async atualizarStatus(
    id: number,
    dto: AtualizarStatusChamadoDto,
    tecnicoAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id },
      relations: RELACOES_PARA_ATUALIZAR,
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    // Capturado ANTES de qualquer mutação — precisamos do valor de verdade
    // pra log de auditoria no final (REABERTURA quando o chamado estava
    // FINALIZADO, MUDANCA_STATUS nos demais casos).
    const statusAnterior = chamado.status;

    // Regra: só entra em ANDAMENTO se ninguém mais estiver atendendo, ou se
    // quem está pedindo for o próprio técnico já responsável — impede que um
    // segundo técnico "roube" um chamado que já está sendo atendido.
    if (dto.status === StatusChamado.ANDAMENTO) {
      const jaTemResponsavel = !!chamado.tecnicoResponsavel;
      const responsavelEhOutroTecnico =
        jaTemResponsavel && chamado.tecnicoResponsavel!.id !== tecnicoAtual.sub;
      if (responsavelEhOutroTecnico) {
        throw new ForbiddenException(
          'Este chamado já está sendo atendido por outro técnico',
        );
      }
      if (!jaTemResponsavel) {
        chamado.tecnicoResponsavel = { id: tecnicoAtual.sub } as Usuario;
      }
    }

    if (dto.status === StatusChamado.FINALIZADO) {
      // Se o técnico pulou direto de PARADO para FINALIZADO sem passar por
      // ANDAMENTO, ainda assim precisamos registrar quem resolveu.
      if (!chamado.tecnicoResponsavel) {
        chamado.tecnicoResponsavel = { id: tecnicoAtual.sub } as Usuario;
      }

      // Regra de negócio (decidida explicitamente, não é comportamento
      // acidental): reabrir um chamado já finalizado e finalizar de novo
      // NÃO pede nem grava uma solução nova — a primeira "como foi
      // resolvido" fica intacta pra sempre. Isso combina com o desenho do
      // banco (SolucaoConhecida é @OneToOne com Chamado) e preserva o
      // histórico da resolução original, em vez de sobrescrevê-la em
      // silêncio. Se um dia for preciso CORRIGIR uma solução registrada
      // errada, isso deveria virar uma tela própria de edição — não
      // reaproveitar o fluxo de finalizar.
      const jaTemSolucao =
        await this.solucoesConhecidasService.existeParaChamado(chamado.id);
      if (!jaTemSolucao) {
        if (!dto.comoFoiResolvido?.trim()) {
          throw new BadRequestException(
            'Descreva como o chamado foi resolvido para finalizar',
          );
        }
        await this.solucoesConhecidasService.criar({
          chamadoId: chamado.id,
          comoFoiResolvido: dto.comoFoiResolvido,
          marcadaComo: dto.marcadaComo ?? false,
          categoria: chamado.categoria,
          imagensUrls: dto.imagensUrlsSolucao ?? [],
        });
      }
    }

    // Reabertura (FINALIZADO -> PARADO) com `marcadaComo: true` — mesmo
    // campo do DTO usado pra "criar" a solução na finalização, aqui
    // reaproveitado pra ATUALIZAR uma solução que JÁ existe (toda
    // finalização já cria uma, marcada ou não — ver
    // SolucoesConhecidasService.criar). Só marca (nunca desmarca): não
    // existe UI hoje pra "desmarcar como conhecida", e este DTO não tem
    // como distinguir "não mandou o campo" de "mandou false" de propósito
    // simples aqui.
    if (dto.status === StatusChamado.PARADO && dto.marcadaComo) {
      await this.solucoesConhecidasService.marcarComoConhecida(chamado.id);
    }

    // "Aguardando resposta de": só faz sentido durante atendimento ativo.
    // Precisa ser calculado ANTES de sobrescrever chamado.status abaixo,
    // porque a regra depende do status ANTERIOR (distinguir um verdadeiro
    // "Iniciar Atendimento", vindo de PARADO, de uma chamada idempotente com
    // o chamado já em ANDAMENTO). Iniciar atendimento começa com TECNICO: o
    // colaborador só descreveu o problema ao abrir o chamado, então cabe ao
    // técnico investigar/responder primeiro.
    if (dto.status === StatusChamado.ANDAMENTO) {
      if (chamado.status === StatusChamado.PARADO) {
        chamado.aguardandoRespostaDe = TipoUsuario.TECNICO;
      }
    } else {
      chamado.aguardandoRespostaDe = null;
    }

    chamado.status = dto.status;
    await this.chamadoRepository.save(chamado);

    // Só grava log quando o status realmente muda — uma chamada idempotente
    // (ex: ANDAMENTO chamado de novo pelo mesmo técnico já responsável) não
    // é uma ação nova, é o mesmo estado confirmado de novo.
    if (statusAnterior !== dto.status) {
      const reabertura = statusAnterior === StatusChamado.FINALIZADO;
      await this.logAuditoriaService.registrar({
        chamadoId: id,
        usuarioId: tecnicoAtual.sub,
        acao: reabertura
          ? AcaoAuditoria.REABERTURA
          : AcaoAuditoria.MUDANCA_STATUS,
        descricao: reabertura
          ? `Chamado reaberto (estava "${LABEL_STATUS[statusAnterior]}") — novo status: "${LABEL_STATUS[dto.status]}"`
          : `Status alterado de "${LABEL_STATUS[statusAnterior]}" para "${LABEL_STATUS[dto.status]}"`,
      });
    }

    const atualizado = await this.buscarPorIdOuFalhar(id);
    // Mesmo raciocínio de `criar`: notificação é fire-and-forget, e só faz
    // sentido quando o status realmente mudou (mesma condição do log acima)
    // — uma chamada idempotente não deveria gerar e-mail nenhum.
    //
    // PARADO -> ANDAMENTO (iniciar atendimento, seja a primeira vez ou um
    // técnico retomando um chamado que tinha voltado pra fila) tem e-mail
    // PRÓPRIO, com tom de "alguém já está cuidando disso" — mais específico
    // e diferente do genérico de atualização, que continua cobrindo os
    // demais casos (finalização, reabertura, etc).
    if (statusAnterior !== dto.status) {
      if (
        statusAnterior === StatusChamado.PARADO &&
        dto.status === StatusChamado.ANDAMENTO
      ) {
        void this.emailService
          .enviarNotificacaoAtendimentoIniciado(atualizado)
          .catch((erro: unknown) =>
            this.logger.error(
              'Falha ao notificar início de atendimento por e-mail',
              erro,
            ),
          );
      } else {
        void this.emailService
          // `true`: só técnico chama PATCH /chamados/:id/status
          // (@Roles(TipoUsuario.TECNICO)) — nunca aciona o fallback pra
          // EMAILS_TECNICO_AUTORIZADOS (esse é só pra quando um
          // colaborador comenta sem ninguém ainda ter assumido).
          .enviarNotificacaoAtualizacaoChamado(atualizado, tecnicoAtual.sub, true)
          .catch((erro: unknown) =>
            this.logger.error(
              'Falha ao notificar atualização de chamado por e-mail',
              erro,
            ),
          );
      }
    }
    return atualizado;
  }

  // PATCH /chamados/:id/atribuir — define ou troca o técnico responsável
  // manualmente (diferente da auto-atribuição implícita de
  // atualizarStatus: aqui um técnico escolhe QUALQUER técnico da lista,
  // incluindo si mesmo ou outro colega, e pode desatribuir de volta pra
  // null). `tecnicoId` ausente/null desatribui; um id presente precisa
  // apontar pra um usuário tipo TECNICO — nunca um colaborador, mesmo que o
  // id exista e esteja ativo.
  async atribuir(
    id: number,
    dto: AtribuirChamadoDto,
    usuarioAtual: JwtPayload,
  ): Promise<Chamado> {
    // Carrega `tecnicoResponsavel` (não incluído por padrão num findOne sem
    // `relations`) só pra poder citar o nome de quem estava atendendo antes
    // na descrição do log — sem isso, o texto ficaria genérico demais
    // ("Atribuído a Fulano") sem contar o "de quem" numa troca.
    const chamado = await this.chamadoRepository.findOne({
      where: { id },
      relations: { tecnicoResponsavel: true },
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    const responsavelAnterior = chamado.tecnicoResponsavel;

    if (dto.tecnicoId === null || dto.tecnicoId === undefined) {
      chamado.tecnicoResponsavel = null;
    } else {
      const tecnico = await this.usuarioRepository.findOne({
        where: { id: dto.tecnicoId },
      });
      if (!tecnico || tecnico.tipo !== TipoUsuario.TECNICO) {
        throw new BadRequestException(
          'Só é possível atribuir chamados a técnicos de TI',
        );
      }
      chamado.tecnicoResponsavel = tecnico;
    }

    await this.chamadoRepository.save(chamado);

    const idAnterior = responsavelAnterior?.id ?? null;
    const idNovo = chamado.tecnicoResponsavel?.id ?? null;
    if (idAnterior !== idNovo) {
      let descricao: string;
      if (!responsavelAnterior && chamado.tecnicoResponsavel) {
        descricao = `Atribuído a ${chamado.tecnicoResponsavel.nome}`;
      } else if (responsavelAnterior && !chamado.tecnicoResponsavel) {
        descricao = `Chamado desatribuído (estava com ${responsavelAnterior.nome})`;
      } else {
        descricao = `Responsável alterado de ${responsavelAnterior!.nome} para ${chamado.tecnicoResponsavel!.nome}`;
      }
      await this.logAuditoriaService.registrar({
        chamadoId: id,
        usuarioId: usuarioAtual.sub,
        acao: AcaoAuditoria.ATRIBUICAO,
        descricao,
      });
    }

    return this.buscarPorIdOuFalhar(id);
  }

  // PATCH /chamados/:id/nivel — reclassificação manual. O nível é só uma
  // etiqueta de organização/filtro (ver nivel-triagem.util.ts), NUNCA
  // controle de acesso: qualquer um dos dois técnicos já podia ver e assumir
  // este chamado antes de chamar isso, e continua podendo depois, seja
  // qual for o nível novo. Registra um comentário automático com o "de/para"
  // — é esse comentário que guarda o histórico de quando a sugestão
  // automática precisou de ajuste manual. `tipo: NIVEL_AJUSTADO` (em vez do
  // padrão COMENTARIO) é o que deixa o frontend mostrar isso como um
  // pequeno log de auditoria separado da conversa, em vez de misturado nela.
  async reclassificarNivel(
    id: number,
    dto: AtualizarNivelChamadoDto,
    tecnicoAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({ where: { id } });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    if (dto.nivel !== chamado.nivel) {
      const nivelAnterior = chamado.nivel;
      chamado.nivel = dto.nivel;
      await this.chamadoRepository.save(chamado);

      const comentario = this.comentarioRepository.create({
        chamado: { id } as Chamado,
        autor: { id: tecnicoAtual.sub } as Usuario,
        texto: `Nível ajustado de ${nivelAnterior} para ${dto.nivel}`,
        // Interno: é uma nota operacional pro time de TI acompanhar a
        // qualidade da regra automática, não algo relevante pro colaborador
        // que abriu o chamado.
        interno: true,
        tipo: TipoComentario.NIVEL_AJUSTADO,
      });
      await this.comentarioRepository.save(comentario);

      // Mesma mudança, duas trilhas: o comentário automático acima
      // alimenta o "Histórico de nível" já existente no painel; este
      // registro aqui alimenta o novo "Histórico de alterações" (log de
      // auditoria geral, ver GET /chamados/:id/logs) — nenhum dos dois
      // substitui o outro.
      await this.logAuditoriaService.registrar({
        chamadoId: id,
        usuarioId: tecnicoAtual.sub,
        acao: AcaoAuditoria.EDICAO,
        descricao: `Nível alterado de ${nivelAnterior} para ${dto.nivel}`,
      });
    }

    return this.buscarPorIdOuFalhar(id);
  }

  // PATCH /chamados/:id/prioridade — diferente de reclassificarNivel
  // (só técnico, sem checagem de dono: nível é etiqueta técnica), aqui o
  // SOLICITANTE também pode ajustar a própria prioridade, além de
  // qualquer técnico. Sem @Roles() no controller de propósito — a
  // autorização mista (dono OU técnico) só cabe dentro do service, mesmo
  // padrão de buscarDetalhado.
  async atualizarPrioridade(
    id: number,
    dto: AtualizarPrioridadeChamadoDto,
    usuarioAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id },
      relations: RELACOES_PARA_ATUALIZAR,
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    const ehSolicitante = chamado.solicitante.id === usuarioAtual.sub;
    const ehTecnico = usuarioAtual.tipo === TipoUsuario.TECNICO;
    if (!ehSolicitante && !ehTecnico) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar a prioridade deste chamado',
      );
    }

    if (chamado.status === StatusChamado.FINALIZADO) {
      throw new BadRequestException(
        'Não é possível alterar prioridade de chamado finalizado',
      );
    }

    // Idempotente, mesmo raciocínio de reclassificarNivel: reenviar a
    // mesma prioridade não é uma mudança de verdade, não gera log.
    if (dto.prioridade !== chamado.prioridade) {
      const prioridadeAnterior = chamado.prioridade;
      chamado.prioridade = dto.prioridade;
      await this.chamadoRepository.save(chamado);

      await this.logAuditoriaService.registrar({
        chamadoId: id,
        usuarioId: usuarioAtual.sub,
        acao: AcaoAuditoria.EDICAO,
        descricao: `Prioridade alterada de "${LABEL_PRIORIDADE[prioridadeAnterior]}" para "${LABEL_PRIORIDADE[dto.prioridade]}"`,
      });
    }

    return this.buscarPorIdOuFalhar(id);
  }

  // PATCH /chamados/:id/categoria — mesma autorização/restrição de
  // atualizarPrioridade (solicitante OU técnico, bloqueado se FINALIZADO).
  // Diferente de prioridade, trocar categoria RECALCULA o nível
  // automaticamente: a categoria é o principal sinal de
  // calcularNivelSugerido (nivelPadrao + palavras-chave sobre o texto já
  // existente do chamado), então deixar o nível "parado" na categoria
  // antiga depois de uma troca deliberada ficaria inconsistente — decisão
  // confirmada com o usuário antes de implementar.
  async atualizarCategoria(
    id: number,
    dto: AtualizarCategoriaChamadoDto,
    usuarioAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id },
      relations: RELACOES_PARA_ATUALIZAR,
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    const ehSolicitante = chamado.solicitante.id === usuarioAtual.sub;
    const ehTecnico = usuarioAtual.tipo === TipoUsuario.TECNICO;
    if (!ehSolicitante && !ehTecnico) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar a categoria deste chamado',
      );
    }

    if (chamado.status === StatusChamado.FINALIZADO) {
      throw new BadRequestException(
        'Não é possível alterar categoria de chamado finalizado',
      );
    }

    const novaCategoria = await this.categoriasService.buscarAtivaPorNomeOuFalhar(
      dto.categoria,
    );

    // Idempotente, mesmo raciocínio de atualizarPrioridade: reenviar a
    // mesma categoria não é uma mudança de verdade, não gera log nem
    // recalcula nível.
    if (novaCategoria.id !== chamado.categoria.id) {
      const categoriaAnterior = chamado.categoria;
      const nivelAnterior = chamado.nivel;
      const palavrasChaveN3 = await this.palavrasChaveN3Service.listarAtivas();

      chamado.categoria = novaCategoria;
      chamado.nivel = calcularNivelSugerido(
        novaCategoria,
        chamado.descricao,
        chamado.mensagemErro,
        palavrasChaveN3.map((p) => p.palavra),
      );
      await this.chamadoRepository.save(chamado);

      const descricaoNivel =
        chamado.nivel !== nivelAnterior
          ? ` (nível recalculado de ${nivelAnterior} para ${chamado.nivel})`
          : '';
      await this.logAuditoriaService.registrar({
        chamadoId: id,
        usuarioId: usuarioAtual.sub,
        acao: AcaoAuditoria.EDICAO,
        descricao: `Categoria alterada de "${categoriaAnterior.nome}" para "${novaCategoria.nome}"${descricaoNivel}`,
      });
    }

    return this.buscarPorIdOuFalhar(id);
  }
}
