import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Tarefa } from './entities/tarefa.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { StatusTarefa } from '../common/enums/status-tarefa.enum';
import {
  RespostaPaginadaDto,
  calcularPaginacao,
  montarRespostaPaginada,
} from '../common/dto/resposta-paginada.dto';

@Injectable()
export class TarefasService {
  constructor(
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
  ) {}

  // `status`, quando informado, restringe a UMA coluna do Kanban — cada
  // uma pagina/"carrega mais" de forma independente (ver MinhasTarefas.jsx),
  // pensando em volume acumulado ao longo do tempo (ex: "Concluído" com
  // anos de tarefas versus "A fazer" sempre pequeno). Mais recentes
  // primeiro (criadaEm DESC), igual sempre foi.
  async listar(
    usuarioId: number,
    status?: StatusTarefa,
    pagina?: number,
    limite?: number,
  ): Promise<RespostaPaginadaDto<Tarefa>> {
    const where: FindOptionsWhere<Tarefa> = { usuario: { id: usuarioId } };
    if (status) where.status = status;
    const paginacao = calcularPaginacao(pagina, limite);
    const [tarefas, total] = await this.tarefaRepository.findAndCount({
      where,
      order: { criadaEm: 'DESC' },
      skip: paginacao.skip,
      take: paginacao.limite,
    });
    return montarRespostaPaginada(
      tarefas,
      total,
      paginacao.pagina,
      paginacao.limite,
    );
  }

  async criar(dto: CriarTarefaDto, usuarioId: number): Promise<Tarefa> {
    const tarefa = this.tarefaRepository.create({
      titulo: dto.titulo,
      descricao: dto.descricao ?? null,
      status: StatusTarefa.A_FAZER,
      usuario: { id: usuarioId } as Usuario,
    });
    return this.tarefaRepository.save(tarefa);
  }

  async atualizar(
    id: number,
    usuarioId: number,
    dto: AtualizarTarefaDto,
  ): Promise<Tarefa> {
    const tarefa = await this.buscarPorIdOuFalhar(id, usuarioId);

    if (dto.titulo !== undefined) tarefa.titulo = dto.titulo;
    if (dto.descricao !== undefined) tarefa.descricao = dto.descricao;
    if (dto.status !== undefined) tarefa.status = dto.status;

    return this.tarefaRepository.save(tarefa);
  }

  async remover(id: number, usuarioId: number): Promise<void> {
    const tarefa = await this.buscarPorIdOuFalhar(id, usuarioId);
    await this.tarefaRepository.remove(tarefa);
  }

  // Único ponto de leitura por id — SEMPRE filtrado por dono junto (nunca
  // um `findOne({ where: { id } })` seguido de checagem manual à parte).
  // Assim, uma tarefa de outra pessoa simplesmente não existe do ponto de
  // vista de quem chama: 404 igual a um id inexistente de verdade, nunca
  // um 403 que confirmaria "esse id existe, só não é seu" — mesmo
  // raciocínio de esconder existência já usado no restante da API.
  private async buscarPorIdOuFalhar(
    id: number,
    usuarioId: number,
  ): Promise<Tarefa> {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id, usuario: { id: usuarioId } },
    });
    if (!tarefa) throw new NotFoundException('Tarefa não encontrada');
    return tarefa;
  }
}
