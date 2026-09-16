import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  Not,
  IsNull,
  QueryFailedError,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Aviso } from './entities/aviso.entity';
import { AvisoLeitura } from './entities/aviso-leitura.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Grupo } from '../grupos/entities/grupo.entity';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { DestinatarioAvisoTipo } from '../common/enums/destinatario-aviso.enum';
import { EmailService } from '../email/email.service';
import { CriarAvisoDto } from './dto/criar-aviso.dto';
import { AtualizarAvisoDto } from './dto/atualizar-aviso.dto';
import { FiltrosAvisoDto } from './dto/filtros-aviso.dto';
import {
  AvisoResponseDto,
  mapAvisoParaResposta,
} from './dto/aviso-response.dto';
import {
  LeitorAvisoResponseDto,
  mapLeituraParaLeitorResposta,
} from './dto/leitor-aviso-response.dto';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import {
  calcularPaginacao,
  montarRespostaPaginada,
  RespostaPaginadaDto,
} from '../common/dto/resposta-paginada.dto';

@Injectable()
export class AvisosService {
  constructor(
    @InjectRepository(Aviso)
    private readonly avisoRepository: Repository<Aviso>,
    @InjectRepository(AvisoLeitura)
    private readonly leituraRepository: Repository<AvisoLeitura>,
    // Só leitura — pra montar `autor` completo (nome, cargo...) na resposta
    // de POST /avisos sem precisar recarregar o Aviso do banco depois do
    // save() (mesmo raciocínio de ObservadoresService injetar UsuarioRepository).
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    // Só leitura, pra validar `grupoId` (existe? ver validarEscopo) e
    // resolver os membros na hora de montar a lista de e-mail de um aviso
    // GRUPO — injetado direto aqui em vez de importar GruposService, mesmo
    // raciocínio de `usuarioRepository` acima (evita acoplar módulos só
    // por uma consulta simples).
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
    // Notificação por e-mail ao publicar (ver `criar` abaixo) — o próprio
    // EmailService garante que uma falha de envio nunca propaga pra cá.
    private readonly emailService: EmailService,
  ) {}

  // Fixados primeiro, depois mais recente primeiro — nessa ordem mesmo com
  // um aviso fixado sendo mais antigo que um recém-publicado (ORDER BY
  // fixado DESC vem antes de publicadoEm DESC). `incluirExpirados` só tem
  // efeito de verdade quando quem pede é TECNICO — um COLABORADOR que
  // mande o parâmetro é simplesmente ignorado, sempre vê só os ativos.
  async listar(
    usuarioAtual: JwtPayload,
    filtros: FiltrosAvisoDto,
  ): Promise<RespostaPaginadaDto<AvisoResponseDto>> {
    const podeIncluirExpirados =
      !!filtros.incluirExpirados && usuarioAtual.tipo === TipoUsuario.TECNICO;
    const { pagina, limite, skip } = calcularPaginacao(
      filtros.pagina,
      filtros.limite,
    );

    // Fábrica em vez de uma query só, porque o WHERE de "ativo" precisa
    // valer TANTO pra contagem do total quanto pra query de dados — usar a
    // MESMA instância de QueryBuilder pras duas coisas não dá, porque
    // .getCount() e .getRawAndEntities() cada um já executa/consome a
    // query à sua própria maneira.
    const construirBase = () => {
      const query = this.avisoRepository.createQueryBuilder('aviso');
      if (!podeIncluirExpirados) {
        query.andWhere('(aviso.expiraEm IS NULL OR aviso.expiraEm > :agora)', {
          agora: new Date(),
        });
      }
      this.aplicarFiltroEscopo(query, usuarioAtual);
      return query;
    };

    const total = await construirBase().getCount();

    const query = construirBase()
      .leftJoinAndSelect('aviso.autor', 'autor')
      .leftJoinAndSelect('aviso.grupo', 'grupo')
      .leftJoinAndSelect('aviso.usuarioDestinatario', 'usuarioDestinatario')
      .leftJoin(
        AvisoLeitura,
        'leitura',
        'leitura.avisoId = aviso.id AND leitura.usuarioId = :usuarioId',
        { usuarioId: usuarioAtual.sub },
      )
      .addSelect('leitura.id', 'leitura_id')
      .orderBy('aviso.fixado', 'DESC')
      .addOrderBy('aviso.publicadoEm', 'DESC')
      .skip(skip)
      .take(limite);

    const { entities, raw } = await query.getRawAndEntities<{
      leitura_id: number | null;
    }>();
    if (entities.length === 0) {
      return montarRespostaPaginada([], total, pagina, limite);
    }

    // Segunda query separada (em vez de mais um JOIN na de cima) — o join
    // de `leitura` acima é FILTRADO pelo usuário atual (no máximo 1 linha
    // por aviso), então não interfere na contagem daqui, mas manter os
    // dois numa query só exigiria GROUP BY em todas as colunas do aviso já
    // selecionadas — mais simples e mais claro separar.
    //
    // Só conta COLABORADOR — "Visto por X pessoas" é sobre quem o aviso
    // avisa (o público-alvo), não sobre técnicos abrindo o próprio Mural
    // pra conferir. Sem esse filtro, um técnico que só passa o olho na
    // tela já se contaria como "leitor" do próprio aviso.
    const contagens = await this.leituraRepository
      .createQueryBuilder('leitura')
      .innerJoin('leitura.usuario', 'usuario')
      .select('leitura.avisoId', 'avisoId')
      .addSelect('COUNT(*)', 'total')
      .where('leitura.avisoId IN (:...ids)', {
        ids: entities.map((aviso) => aviso.id),
      })
      .andWhere('usuario.tipo = :tipo', { tipo: TipoUsuario.COLABORADOR })
      .groupBy('leitura.avisoId')
      .getRawMany<{ avisoId: number; total: string }>();
    const mapaContagem = new Map(
      contagens.map((c) => [c.avisoId, Number(c.total)]),
    );

    const itens = entities.map((aviso, indice) =>
      mapAvisoParaResposta(
        aviso,
        raw[indice].leitura_id != null,
        mapaContagem.get(aviso.id) ?? 0,
      ),
    );
    return montarRespostaPaginada(itens, total, pagina, limite);
  }

  // GET /avisos/:id/leitores (TECNICO-only, ver AvisosController) — lista
  // completa de quem já leu, mais antigo primeiro (ordem de leitura, não
  // alfabética). Só COLABORADOR, mesmo filtro e mesmo motivo de
  // contarLeituras() acima — os dois precisam concordar, senão o número
  // do botão "Visto por X pessoas" e a lista que abre embaixo dele
  // batem números diferentes.
  async listarLeitores(avisoId: number): Promise<LeitorAvisoResponseDto[]> {
    const aviso = await this.avisoRepository.findOne({
      where: { id: avisoId },
    });
    if (!aviso) throw new NotFoundException('Aviso não encontrado');

    const leituras = await this.leituraRepository.find({
      where: {
        aviso: { id: avisoId },
        usuario: { tipo: TipoUsuario.COLABORADOR },
      },
      relations: { usuario: true },
      order: { lidoEm: 'ASC' },
    });
    return leituras.map(mapLeituraParaLeitorResposta);
  }

  // GET /avisos/nao-lidos/contagem — mesmo filtro de "ativo" de listar(),
  // só que sem carregar `autor`/montar a resposta inteira, pro badge da
  // sidebar poder ser leve. Mesmo filtro de escopo de listar() também —
  // sem ele, o badge contaria aviso que o colaborador nem consegue ver no
  // Mural (número maior que a quantidade de itens realmente exibidos).
  async contarNaoLidos(usuarioAtual: JwtPayload): Promise<number> {
    const query = this.avisoRepository
      .createQueryBuilder('aviso')
      .leftJoin(
        AvisoLeitura,
        'leitura',
        'leitura.avisoId = aviso.id AND leitura.usuarioId = :usuarioId',
        { usuarioId: usuarioAtual.sub },
      )
      .where('(aviso.expiraEm IS NULL OR aviso.expiraEm > :agora)', {
        agora: new Date(),
      })
      .andWhere('leitura.id IS NULL');

    this.aplicarFiltroEscopo(query, usuarioAtual);
    return query.getCount();
  }

  async criar(dto: CriarAvisoDto, autorId: number): Promise<AvisoResponseDto> {
    // Não deveria falhar nunca na prática (autorId vem do próprio JWT de
    // quem já passou pelo RolesGuard como TECNICO), mas resolve o autor
    // completo aqui mesmo assim — mesma postura defensiva de
    // ObservadoresService.adicionar ao validar o usuário buscado.
    const autor = await this.usuarioRepository.findOne({
      where: { id: autorId },
    });
    if (!autor) throw new NotFoundException('Autor não encontrado');

    const { grupo, usuarioDestinatario } = await this.validarEscopo(
      dto.destinatarioTipo,
      dto.grupoId,
      dto.usuarioId,
    );

    const aviso = this.avisoRepository.create({
      titulo: dto.titulo,
      mensagem: dto.mensagem,
      tipo: dto.tipo,
      fixado: dto.fixado ?? false,
      // SEM "Z": string vem de <input type="datetime-local">, interpretada
      // como horário LOCAL do servidor — mesmo cuidado de
      // ChamadosService.resolverPeriodo (ver comentário em Aviso.expiraEm).
      expiraEm: dto.expiraEm ? new Date(dto.expiraEm) : null,
      autor,
      destinatarioTipo: dto.destinatarioTipo,
      grupo,
      usuarioDestinatario,
    });
    const salvo = await this.avisoRepository.save(aviso);

    // Fire-and-forget (o próprio EmailService nunca propaga falha) — lista
    // de destinatários respeita o mesmo escopo do aviso, não mais sempre
    // "todo colaborador": TODOS mantém o comportamento de sempre; GRUPO
    // notifica só os membros do grupo que são COLABORADOR (mesmo que o
    // grupo também tenha técnico — Grupo aceita os dois tipos, mas esta
    // notificação sempre foi dirigida a colaborador); USUARIO notifica só
    // aquele colaborador. Em todo caso, só quem está ATIVO (`senhaHash`
    // preenchido — null é conta resetada, mesmo critério de sempre).
    void this.resolverDestinatariosEmail(salvo).then((emails) =>
      this.emailService.enviarNotificacaoAvisoNovo(salvo, emails),
    );

    // Aviso recém-criado: impossível existir AvisoLeitura pra ele ainda —
    // 0 é sempre o valor correto aqui, não uma query desnecessária.
    return mapAvisoParaResposta(salvo, false, 0);
  }

  async atualizar(
    id: number,
    dto: AtualizarAvisoDto,
  ): Promise<AvisoResponseDto> {
    const aviso = await this.buscarPorIdOuFalhar(id);

    if (dto.titulo !== undefined) aviso.titulo = dto.titulo;
    if (dto.mensagem !== undefined) aviso.mensagem = dto.mensagem;
    if (dto.tipo !== undefined) aviso.tipo = dto.tipo;
    if (dto.fixado !== undefined) aviso.fixado = dto.fixado;
    // `expiraEm` distingue "não veio no corpo" (undefined, não mexe) de
    // "veio null" (limpa a expiração) de "veio string" (define nova data) —
    // mesma conversão local (sem "Z") do criar().
    if (dto.expiraEm !== undefined) {
      aviso.expiraEm = dto.expiraEm ? new Date(dto.expiraEm) : null;
    }
    // Escopo só muda se `destinatarioTipo` vier no corpo — mesmo raciocínio
    // de `expiraEm` acima (undefined = não mexe). grupoId/usuarioId só
    // fazem sentido JUNTO de um destinatarioTipo novo nesta requisição
    // (não dá pra só trocar o grupo sem reafirmar o tipo).
    if (dto.destinatarioTipo !== undefined) {
      const { grupo, usuarioDestinatario } = await this.validarEscopo(
        dto.destinatarioTipo,
        dto.grupoId,
        dto.usuarioId,
      );
      aviso.destinatarioTipo = dto.destinatarioTipo;
      aviso.grupo = grupo;
      aviso.usuarioDestinatario = usuarioDestinatario;
    }

    const salvo = await this.avisoRepository.save(aviso);
    // `lido` não faz sentido nesta resposta (é por usuário, PATCH é sempre
    // de técnico) — false é só o valor mais neutro. `totalLeitores` aqui
    // não precisa ser exato (o frontend recarrega a lista inteira após
    // salvar, ver MuralAvisos.aoSalvarModal) — 0 evita uma query extra só
    // pra um valor descartado no instante seguinte.
    return mapAvisoParaResposta(salvo, false, 0);
  }

  async remover(id: number): Promise<void> {
    const aviso = await this.buscarPorIdOuFalhar(id);
    await this.avisoRepository.remove(aviso);
  }

  // Idempotente de propósito: o frontend chama isso toda vez que o Mural é
  // aberto ou um aviso é visualizado, sem checar antes se já foi lido — não
  // deve virar erro na segunda chamada (diferente de
  // ObservadoresService.adicionar, que lança ConflictException; aqui não há
  // "ação duplicada" pra recusar, só um estado que já é verdade).
  async marcarLido(avisoId: number, usuarioAtual: JwtPayload): Promise<void> {
    const usuarioId = usuarioAtual.sub;
    const aviso = await this.avisoRepository.findOne({
      where: { id: avisoId },
      relations: { grupo: true, usuarioDestinatario: true },
    });
    if (!aviso) throw new NotFoundException('Aviso não encontrado');

    // Mesma regra de escopo de listar()/contarNaoLidos() — um colaborador
    // fora do público-alvo do aviso não pode marcá-lo como lido, mesmo
    // sabendo o id (esse aviso nunca chega a aparecer pra ele no Mural).
    if (!(await this.usuarioPodeVerAviso(aviso, usuarioAtual))) {
      throw new ForbiddenException(
        'Você não tem permissão para ver este aviso',
      );
    }

    const jaLido = await this.leituraRepository.findOne({
      where: { aviso: { id: avisoId }, usuario: { id: usuarioId } },
    });
    if (jaLido) return;

    // O findOne acima NÃO elimina a corrida: duas requisições concorrentes
    // pro mesmo aviso/usuário (ex: MuralAvisos.jsx dispara um
    // Promise.all(...marcarAvisoLido) por aviso não lido ao montar a tela,
    // e o StrictMode do React roda esse efeito duas vezes) podem passar
    // pelo "jaLido? não" as duas, e a segunda INSERT bate na constraint
    // única @Unique(['aviso', 'usuario']) de AvisoLeitura. Isso é
    // exatamente o cenário — não uma hipótese: reproduzido de verdade num
    // teste de estresse com volume alto de avisos não lidos, virando um
    // 500 cru que derrubava a tela inteira do Mural.
    //
    // Em vez de tentar eliminar a corrida com lock/transação (mais
    // complexo do que o problema pede), tratamos o sintoma da forma
    // correta pro que essa operação realmente significa: chegar aqui e a
    // constraint reclamar SÓ pode significar "alguém já inseriu essa
    // leitura entre o SELECT e o INSERT" — ou seja, o estado que
    // marcarLido() deveria deixar já é verdade. Idempotente por
    // definição (ver comentário da função), então essa violação
    // específica também deve ser um retorno silencioso, não um erro.
    try {
      const leitura = this.leituraRepository.create({
        aviso: { id: avisoId } as Aviso,
        usuario: { id: usuarioId } as Usuario,
      });
      await this.leituraRepository.save(leitura);
    } catch (erro: unknown) {
      const codigoPg =
        erro instanceof QueryFailedError
          ? (erro as unknown as { code?: string }).code
          : undefined;
      if (codigoPg === '23505') return;
      throw erro;
    }
  }

  // Só chamado por criar() (fire-and-forget) — resolve os e-mails de quem
  // deve ser notificado, respeitando o escopo do aviso recém-publicado.
  private async resolverDestinatariosEmail(aviso: Aviso): Promise<string[]> {
    if (aviso.destinatarioTipo === DestinatarioAvisoTipo.USUARIO) {
      const usuario = await this.usuarioRepository.findOne({
        where: {
          id: aviso.usuarioDestinatario!.id,
          tipo: TipoUsuario.COLABORADOR,
          senhaHash: Not(IsNull()),
        },
        select: { email: true },
      });
      return usuario ? [usuario.email] : [];
    }

    if (aviso.destinatarioTipo === DestinatarioAvisoTipo.GRUPO) {
      const linhas: { email: string }[] = await this.avisoRepository.manager
        .createQueryBuilder(Usuario, 'usuario')
        .select('usuario.email', 'email')
        .innerJoin('grupo_membros', 'membro', 'membro."usuarioId" = usuario.id')
        .where('membro."grupoId" = :grupoId', { grupoId: aviso.grupo!.id })
        .andWhere('usuario.tipo = :tipo', { tipo: TipoUsuario.COLABORADOR })
        .andWhere('usuario.senhaHash IS NOT NULL')
        .getRawMany();
      return linhas.map((l) => l.email);
    }

    // TODOS — mesmo critério de sempre.
    const colaboradores = await this.usuarioRepository.find({
      where: { tipo: TipoUsuario.COLABORADOR, senhaHash: Not(IsNull()) },
      select: { email: true },
    });
    return colaboradores.map((c) => c.email);
  }

  private async buscarPorIdOuFalhar(id: number): Promise<Aviso> {
    const aviso = await this.avisoRepository.findOne({
      where: { id },
      relations: { autor: true, grupo: true, usuarioDestinatario: true },
    });
    if (!aviso) throw new NotFoundException('Aviso não encontrado');
    return aviso;
  }

  // Compartilhado por listar() e contarNaoLidos() — as duas listagens que
  // um COLABORADOR pode disparar precisam concordar sobre "quais avisos
  // este usuário pode ver", senão o badge de não-lidos (contarNaoLidos) e
  // a lista que ele abre ao clicar (listar) mostram números diferentes.
  // TECNICO nunca é filtrado (ver comentário em Aviso.destinatarioTipo).
  private aplicarFiltroEscopo(
    query: SelectQueryBuilder<Aviso>,
    usuarioAtual: JwtPayload,
  ): void {
    if (usuarioAtual.tipo !== TipoUsuario.COLABORADOR) return;
    query.andWhere(
      new Brackets((qb) => {
        qb.where('aviso.destinatarioTipo = :todos', {
          todos: DestinatarioAvisoTipo.TODOS,
        })
          .orWhere(
            '(aviso.destinatarioTipo = :porUsuario AND aviso.usuarioId = :usuarioId)',
            {
              porUsuario: DestinatarioAvisoTipo.USUARIO,
              usuarioId: usuarioAtual.sub,
            },
          )
          .orWhere(
            `(aviso.destinatarioTipo = :porGrupo AND aviso.grupoId IN (
              SELECT "grupoId" FROM grupo_membros WHERE "usuarioId" = :usuarioIdGrupo
            ))`,
            {
              porGrupo: DestinatarioAvisoTipo.GRUPO,
              usuarioIdGrupo: usuarioAtual.sub,
            },
          );
      }),
    );
  }

  // Mesma regra de aplicarFiltroEscopo(), mas avaliada em memória contra UM
  // aviso já carregado (marcarLido não passa por QueryBuilder) — os dois
  // precisam concordar entre si pelo mesmo motivo do comentário acima.
  // TECNICO sempre pode (não é filtrado em lugar nenhum deste feature).
  private async usuarioPodeVerAviso(
    aviso: Aviso,
    usuarioAtual: JwtPayload,
  ): Promise<boolean> {
    if (usuarioAtual.tipo !== TipoUsuario.COLABORADOR) return true;
    if (aviso.destinatarioTipo === DestinatarioAvisoTipo.TODOS) return true;
    if (aviso.destinatarioTipo === DestinatarioAvisoTipo.USUARIO) {
      return aviso.usuarioDestinatario?.id === usuarioAtual.sub;
    }
    // GRUPO
    if (!aviso.grupo) return false;
    const linhas: { existe: boolean }[] =
      await this.avisoRepository.manager.query(
        'SELECT EXISTS(SELECT 1 FROM grupo_membros WHERE "grupoId" = $1 AND "usuarioId" = $2) AS existe',
        [aviso.grupo.id, usuarioAtual.sub],
      );
    return linhas[0]?.existe === true;
  }

  // Validação da exclusividade "só um de grupoId/usuarioId, dependendo de
  // destinatarioTipo" — não dá pra expressar isso só com class-validator
  // (depende de outro campo do mesmo DTO), então fica aqui, compartilhada
  // por criar() e atualizar(). Também confirma que o grupo/usuário
  // referenciado realmente existe, devolvendo a entity já carregada (evita
  // uma segunda consulta separada só pra isso).
  private async validarEscopo(
    destinatarioTipo: DestinatarioAvisoTipo,
    grupoId: number | undefined,
    usuarioId: number | undefined,
  ): Promise<{ grupo: Grupo | null; usuarioDestinatario: Usuario | null }> {
    if (destinatarioTipo === DestinatarioAvisoTipo.TODOS) {
      if (grupoId !== undefined || usuarioId !== undefined) {
        throw new BadRequestException(
          'destinatarioTipo TODOS não aceita grupoId nem usuarioId',
        );
      }
      return { grupo: null, usuarioDestinatario: null };
    }

    if (destinatarioTipo === DestinatarioAvisoTipo.GRUPO) {
      if (grupoId === undefined || usuarioId !== undefined) {
        throw new BadRequestException(
          'destinatarioTipo GRUPO exige grupoId e não aceita usuarioId',
        );
      }
      const grupo = await this.grupoRepository.findOne({
        where: { id: grupoId },
      });
      if (!grupo) throw new NotFoundException('Grupo não encontrado');
      return { grupo, usuarioDestinatario: null };
    }

    // USUARIO
    if (usuarioId === undefined || grupoId !== undefined) {
      throw new BadRequestException(
        'destinatarioTipo USUARIO exige usuarioId e não aceita grupoId',
      );
    }
    const usuarioDestinatario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });
    if (!usuarioDestinatario) {
      throw new NotFoundException('Colaborador não encontrado');
    }
    return { grupo: null, usuarioDestinatario };
  }
}
