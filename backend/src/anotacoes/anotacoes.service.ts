import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anotacao } from './entities/anotacao.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CriarAnotacaoDto } from './dto/criar-anotacao.dto';
import { AtualizarAnotacaoDto } from './dto/atualizar-anotacao.dto';
import {
  RespostaPaginadaDto,
  calcularPaginacao,
  montarRespostaPaginada,
} from '../common/dto/resposta-paginada.dto';

@Injectable()
export class AnotacoesService {
  constructor(
    @InjectRepository(Anotacao)
    private readonly anotacaoRepository: Repository<Anotacao>,
  ) {}

  // Mais recentes primeiro, paginado — sem lista de status/coluna aqui
  // (Minhas Anotações é uma grade só, não um Kanban), então basta
  // pagina/limite puros, mesmo padrão de PaginacaoDto usado no resto da
  // API. Pensado pro mesmo cenário de volume acumulado ao longo do tempo
  // que motivou paginar Meus Chamados/Minhas Tarefas.
  async listar(
    usuarioId: number,
    pagina?: number,
    limite?: number,
  ): Promise<RespostaPaginadaDto<Anotacao>> {
    const paginacao = calcularPaginacao(pagina, limite);
    const [anotacoes, total] = await this.anotacaoRepository.findAndCount({
      where: { usuario: { id: usuarioId } },
      order: { criadaEm: 'DESC' },
      skip: paginacao.skip,
      take: paginacao.limite,
    });
    return montarRespostaPaginada(
      anotacoes,
      total,
      paginacao.pagina,
      paginacao.limite,
    );
  }

  async criar(dto: CriarAnotacaoDto, usuarioId: number): Promise<Anotacao> {
    const anotacao = this.anotacaoRepository.create({
      conteudo: dto.conteudo,
      usuario: { id: usuarioId } as Usuario,
    });
    return this.anotacaoRepository.save(anotacao);
  }

  async atualizar(
    id: number,
    usuarioId: number,
    dto: AtualizarAnotacaoDto,
  ): Promise<Anotacao> {
    const anotacao = await this.buscarPorIdOuFalhar(id, usuarioId);
    anotacao.conteudo = dto.conteudo;
    return this.anotacaoRepository.save(anotacao);
  }

  async remover(id: number, usuarioId: number): Promise<void> {
    const anotacao = await this.buscarPorIdOuFalhar(id, usuarioId);
    await this.anotacaoRepository.remove(anotacao);
  }

  // Mesmo raciocínio de TarefasService.buscarPorIdOuFalhar: SEMPRE filtra
  // por dono junto, nunca um findOne por id seguido de checagem à parte —
  // anotação de outra pessoa não existe do ponto de vista de quem chama
  // (404, nunca 403).
  private async buscarPorIdOuFalhar(
    id: number,
    usuarioId: number,
  ): Promise<Anotacao> {
    const anotacao = await this.anotacaoRepository.findOne({
      where: { id, usuario: { id: usuarioId } },
    });
    if (!anotacao) throw new NotFoundException('Anotação não encontrada');
    return anotacao;
  }
}
