import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SugestaoForum } from './entities/sugestao-forum.entity';
import { ComentarioForum } from './entities/comentario-forum.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { StatusSugestao } from '../common/enums/status-sugestao.enum';
import { CriarSugestaoDto } from './dto/criar-sugestao.dto';
import { CriarComentarioForumDto } from './dto/criar-comentario-forum.dto';
import { AtualizarStatusSugestaoDto } from './dto/atualizar-status-sugestao.dto';
import { FiltrosSugestaoDto } from './dto/filtros-sugestao.dto';
import {
  SugestaoResponseDto,
  mapSugestaoParaResposta,
} from './dto/sugestao-response.dto';
import {
  ComentarioForumResponseDto,
  mapComentarioForumParaResposta,
} from './dto/comentario-forum-response.dto';
import {
  calcularPaginacao,
  montarRespostaPaginada,
  RespostaPaginadaDto,
} from '../common/dto/resposta-paginada.dto';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(SugestaoForum)
    private readonly sugestaoRepository: Repository<SugestaoForum>,
    @InjectRepository(ComentarioForum)
    private readonly comentarioRepository: Repository<ComentarioForum>,
    // Só leitura — resolve `autor` completo na resposta de criar() sem
    // precisar recarregar do banco depois do save() (mesmo raciocínio de
    // AvisosService injetar UsuarioRepository).
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  // Mais recentes primeiro, com a contagem de comentários de cada sugestão
  // — mesmo padrão de duas queries separadas de AvisosService.listar pra
  // `totalLeitores` (a contagem agrupada não interfere na query paginada
  // principal, e evita um GROUP BY em todas as colunas da sugestão).
  async listar(
    filtros: FiltrosSugestaoDto,
  ): Promise<RespostaPaginadaDto<SugestaoResponseDto>> {
    const { pagina, limite, skip } = calcularPaginacao(
      filtros.pagina,
      filtros.limite,
    );

    const [sugestoes, total] = await this.sugestaoRepository.findAndCount({
      relations: { autor: true },
      order: { criadaEm: 'DESC' },
      skip,
      take: limite,
    });

    if (sugestoes.length === 0) {
      return montarRespostaPaginada([], total, pagina, limite);
    }

    const contagens = await this.comentarioRepository
      .createQueryBuilder('comentario')
      .select('comentario.sugestaoId', 'sugestaoId')
      .addSelect('COUNT(*)', 'total')
      .where('comentario.sugestaoId IN (:...ids)', {
        ids: sugestoes.map((sugestao) => sugestao.id),
      })
      .groupBy('comentario.sugestaoId')
      .getRawMany<{ sugestaoId: number; total: string }>();
    const mapaContagem = new Map(
      contagens.map((c) => [c.sugestaoId, Number(c.total)]),
    );

    const itens = sugestoes.map((sugestao) =>
      mapSugestaoParaResposta(sugestao, mapaContagem.get(sugestao.id) ?? 0),
    );
    return montarRespostaPaginada(itens, total, pagina, limite);
  }

  // GET /forum/:id — detalhe + comentários da thread, mais antigo primeiro
  // (ordem de leitura natural de uma conversa, diferente da listagem de
  // sugestões em si, que é mais recente primeiro).
  async buscarDetalhe(id: number): Promise<{
    sugestao: SugestaoResponseDto;
    comentarios: ComentarioForumResponseDto[];
  }> {
    const sugestao = await this.buscarPorIdOuFalhar(id);
    const comentarios = await this.comentarioRepository.find({
      where: { sugestao: { id } },
      relations: { autor: true },
      order: { criadoEm: 'ASC' },
    });
    return {
      sugestao: mapSugestaoParaResposta(sugestao, comentarios.length),
      comentarios: comentarios.map(mapComentarioForumParaResposta),
    };
  }

  async criar(
    dto: CriarSugestaoDto,
    autorId: number,
  ): Promise<SugestaoResponseDto> {
    const autor = await this.usuarioRepository.findOne({
      where: { id: autorId },
    });
    if (!autor) throw new NotFoundException('Autor não encontrado');

    const sugestao = this.sugestaoRepository.create({
      titulo: dto.titulo,
      mensagem: dto.mensagem,
      status: StatusSugestao.ABERTA,
      autor,
    });
    const salva = await this.sugestaoRepository.save(sugestao);
    // Sugestão recém-criada: impossível existir comentário pra ela ainda.
    return mapSugestaoParaResposta(salva, 0);
  }

  async comentar(
    sugestaoId: number,
    dto: CriarComentarioForumDto,
    autorId: number,
  ): Promise<ComentarioForumResponseDto> {
    await this.buscarPorIdOuFalhar(sugestaoId);

    const autor = await this.usuarioRepository.findOne({
      where: { id: autorId },
    });
    if (!autor) throw new NotFoundException('Autor não encontrado');

    const comentario = this.comentarioRepository.create({
      mensagem: dto.mensagem,
      sugestao: { id: sugestaoId } as SugestaoForum,
      autor,
    });
    const salvo = await this.comentarioRepository.save(comentario);
    // `autor` já está resolvido acima (não precisa recarregar do banco).
    salvo.autor = autor;
    return mapComentarioForumParaResposta(salvo);
  }

  async atualizarStatus(
    id: number,
    dto: AtualizarStatusSugestaoDto,
  ): Promise<SugestaoResponseDto> {
    const sugestao = await this.buscarPorIdOuFalhar(id);
    sugestao.status = dto.status;
    const salva = await this.sugestaoRepository.save(sugestao);

    const totalComentarios = await this.comentarioRepository.count({
      where: { sugestao: { id } },
    });
    return mapSugestaoParaResposta(salva, totalComentarios);
  }

  private async buscarPorIdOuFalhar(id: number): Promise<SugestaoForum> {
    const sugestao = await this.sugestaoRepository.findOne({
      where: { id },
      relations: { autor: true },
    });
    if (!sugestao) throw new NotFoundException('Sugestão não encontrada');
    return sugestao;
  }
}
