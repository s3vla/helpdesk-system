import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { Aviso } from './entities/aviso.entity';
import { AvisoLeitura } from './entities/aviso-leitura.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
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
      return query;
    };

    const total = await construirBase().getCount();

    const query = construirBase()
      .leftJoinAndSelect('aviso.autor', 'autor')
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
  // sidebar poder ser leve.
  async contarNaoLidos(usuarioId: number): Promise<number> {
    return this.avisoRepository
      .createQueryBuilder('aviso')
      .leftJoin(
        AvisoLeitura,
        'leitura',
        'leitura.avisoId = aviso.id AND leitura.usuarioId = :usuarioId',
        { usuarioId },
      )
      .where('(aviso.expiraEm IS NULL OR aviso.expiraEm > :agora)', {
        agora: new Date(),
      })
      .andWhere('leitura.id IS NULL')
      .getCount();
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
    });
    const salvo = await this.avisoRepository.save(aviso);

    // Fire-and-forget (o próprio EmailService nunca propaga falha) — TODOS
    // os colaboradores ATIVOS, não só técnicos: tipo COLABORADOR e
    // `senhaHash` preenchido (null = conta resetada, aguardando um novo
    // Primeiro Acesso — mesmo critério de "ativo" usado em
    // ChamadosService.criarComoTecnico). Consulta só os 2 campos que
    // interessam (`select`), não a entidade inteira.
    void this.usuarioRepository
      .find({
        where: { tipo: TipoUsuario.COLABORADOR, senhaHash: Not(IsNull()) },
        select: { email: true },
      })
      .then((colaboradores) =>
        this.emailService.enviarNotificacaoAvisoNovo(
          salvo,
          colaboradores.map((colaborador) => colaborador.email),
        ),
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
  async marcarLido(avisoId: number, usuarioId: number): Promise<void> {
    const aviso = await this.avisoRepository.findOne({
      where: { id: avisoId },
    });
    if (!aviso) throw new NotFoundException('Aviso não encontrado');

    const jaLido = await this.leituraRepository.findOne({
      where: { aviso: { id: avisoId }, usuario: { id: usuarioId } },
    });
    if (jaLido) return;

    const leitura = this.leituraRepository.create({
      aviso: { id: avisoId } as Aviso,
      usuario: { id: usuarioId } as Usuario,
    });
    await this.leituraRepository.save(leitura);
  }

  private async buscarPorIdOuFalhar(id: number): Promise<Aviso> {
    const aviso = await this.avisoRepository.findOne({
      where: { id },
      relations: { autor: true },
    });
    if (!aviso) throw new NotFoundException('Aviso não encontrado');
    return aviso;
  }
}
