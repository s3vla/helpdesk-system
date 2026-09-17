import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { SolucaoConhecida } from '../solucoes-conhecidas/entities/solucao-conhecida.entity';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
    @InjectRepository(SolucaoConhecida)
    private readonly solucaoRepository: Repository<SolucaoConhecida>,
  ) {}

  // Admin (Administração → Categorias): lista TODAS, incluindo inativas —
  // é a tela onde o técnico reativa/desativa, então precisa ver as duas.
  async listarTodas(): Promise<Categoria[]> {
    return this.categoriaRepository.find({ order: { nome: 'ASC' } });
  }

  // Dropdown de abertura de chamado e filtros — só as ativas, pra ninguém
  // conseguir abrir um chamado numa categoria que o técnico desativou.
  async listarAtivas(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  // Usado só internamente (ChamadosService.obterMetricas) pra zero-preencher
  // o gráfico "Distribuição por categoria" — precisa dos NOMES, não das
  // entidades inteiras.
  async listarNomesAtivos(): Promise<string[]> {
    const ativas = await this.listarAtivas();
    return ativas.map((c) => c.nome);
  }

  async criar(dto: CriarCategoriaDto): Promise<Categoria> {
    const categoria = this.categoriaRepository.create({
      nome: dto.nome.trim(),
    });
    return this.categoriaRepository.save(categoria);
  }

  // Sem exclusão física de propósito (ver comentário na entity) — só ativa/
  // desativa e ajusta o nível padrão.
  async atualizar(id: number, dto: AtualizarCategoriaDto): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id },
    });
    if (!categoria) throw new NotFoundException('Categoria não encontrada');
    if (dto.ativo !== undefined) categoria.ativo = dto.ativo;
    if (dto.nivelPadrao !== undefined) {
      categoria.nivelPadrao = dto.nivelPadrao;
    }
    return this.categoriaRepository.save(categoria);
  }

  // Usado por ChamadosService.criar pra resolver o `categoria` (string,
  // nome) que vem do corpo de POST /chamados numa entity de verdade — nunca
  // aceita uma categoria INATIVA (mesma regra que EMAILS_COLABORADOR_
  // AUTORIZADOS: mensagem clara, não um erro genérico de FK).
  // DELETE /categorias/:id — exclusão física só quando a categoria nunca
  // foi usada (nenhum Chamado nem SolucaoConhecida apontando pra ela).
  // Categoria já em uso não pode ser excluída de verdade (FK NOT NULL nas
  // duas tabelas — apagar quebraria o histórico) — a alternativa nesse
  // caso é desativar (ver atualizar()), oferecida pelo frontend quando
  // este método rejeita com 409.
  async remover(id: number): Promise<void> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id },
    });
    if (!categoria) throw new NotFoundException('Categoria não encontrada');

    const [totalChamados, totalSolucoes] = await Promise.all([
      this.chamadoRepository.count({ where: { categoria: { id } } }),
      this.solucaoRepository.count({ where: { categoria: { id } } }),
    ]);

    if (totalChamados > 0 || totalSolucoes > 0) {
      const partes: string[] = [];
      if (totalChamados > 0) {
        partes.push(
          `${totalChamados} chamado${totalChamados !== 1 ? 's' : ''}`,
        );
      }
      if (totalSolucoes > 0) {
        partes.push(
          `${totalSolucoes} solução${totalSolucoes !== 1 ? 'ões' : ''} conhecida${totalSolucoes !== 1 ? 's' : ''}`,
        );
      }
      throw new ConflictException(
        `Essa categoria tem ${partes.join(' e ')} vinculado(s) e não pode ser excluída — desative-a em vez de excluir.`,
      );
    }

    await this.categoriaRepository.delete(id);
  }

  async buscarAtivaPorNomeOuFalhar(nome: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { nome },
    });
    if (!categoria || !categoria.ativo) {
      throw new BadRequestException(
        `Categoria "${nome}" não existe ou está desativada`,
      );
    }
    return categoria;
  }
}
