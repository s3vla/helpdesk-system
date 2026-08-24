import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { CriarWidgetDto } from './dto/criar-widget.dto';
import { AtualizarWidgetDto } from './dto/atualizar-widget.dto';
import { AgruparPor } from '../common/enums/agrupar-por.enum';
import { TipoMetrica } from '../common/enums/tipo-metrica.enum';
import { FormatoVisualWidget } from '../common/enums/formato-visual-widget.enum';

// Os 3 widgets que antes eram componentes fixos no código (ver histórico de
// ChamadosService.obterEstatisticas, já removido) — viram os primeiros
// registros da tabela na primeira vez que o servidor sobe. `fixo: true` só
// no de repetição: é o único cuja lógica (categoria + palavra-chave) não
// cabe no motor genérico de GET /chamados/metricas, então não faz sentido
// deixar alguém excluir e não conseguir recriar um equivalente pela UI.
const WIDGETS_SEED: Omit<DashboardWidget, 'id'>[] = [
  {
    titulo: 'Distribuição por nível',
    tipo: TipoMetrica.CONTAGEM,
    agruparPor: AgruparPor.NIVEL,
    formatoVisual: FormatoVisualWidget.BARRA,
    limite: null,
    ordem: 1,
    ativo: true,
    fixo: false,
  },
  {
    titulo: 'Chamados que se repetem',
    tipo: TipoMetrica.RANKING,
    agruparPor: AgruparPor.REPETICAO_CATEGORIA,
    formatoVisual: FormatoVisualWidget.LISTA,
    limite: 10,
    ordem: 2,
    ativo: true,
    fixo: true,
  },
  {
    titulo: 'Quem mais abre chamado',
    tipo: TipoMetrica.RANKING,
    agruparPor: AgruparPor.SOLICITANTE,
    formatoVisual: FormatoVisualWidget.LISTA,
    limite: 10,
    ordem: 3,
    ativo: true,
    fixo: false,
  },
];

@Injectable()
export class DashboardWidgetsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DashboardWidgetsService.name);

  constructor(
    @InjectRepository(DashboardWidget)
    private readonly widgetRepository: Repository<DashboardWidget>,
  ) {}

  // Idempotente: só semeia se a tabela estiver vazia — mesmo raciocínio do
  // SeedService de técnicos (ver database/seed.service.ts), pra nunca
  // duplicar os widgets a cada reinício do servidor.
  async onApplicationBootstrap() {
    const existentes = await this.widgetRepository.count();
    if (existentes > 0) return;

    await this.widgetRepository.save(
      WIDGETS_SEED.map((widget) => this.widgetRepository.create(widget)),
    );
    this.logger.log(
      `${WIDGETS_SEED.length} widgets padrão criados no Dashboard TI`,
    );
  }

  async listar(): Promise<DashboardWidget[]> {
    return this.widgetRepository.find({ order: { ordem: 'ASC' } });
  }

  async criar(dto: CriarWidgetDto): Promise<DashboardWidget> {
    const [ultimo] = await this.widgetRepository.find({
      order: { ordem: 'DESC' },
      take: 1,
    });
    const widget = this.widgetRepository.create({
      titulo: dto.titulo,
      tipo: dto.tipo,
      agruparPor: dto.agruparPor,
      formatoVisual: dto.formatoVisual,
      limite: dto.limite ?? null,
      ordem: (ultimo?.ordem ?? 0) + 1,
      ativo: true,
      fixo: false,
    });
    return this.widgetRepository.save(widget);
  }

  async atualizar(
    id: number,
    dto: AtualizarWidgetDto,
  ): Promise<DashboardWidget> {
    const widget = await this.buscarPorIdOuFalhar(id);
    Object.assign(widget, dto);
    return this.widgetRepository.save(widget);
  }

  // Troca a `ordem` deste widget com a do vizinho adjacente (na lista
  // ordenada por ordem) na direção pedida — sem efeito se já está na ponta.
  // Os dois `save()` acontecem em sequência (better-sqlite3 é síncrono por
  // baixo, então não há risco real de intercalar com outra escrita no meio
  // desta chamada única).
  async mover(
    id: number,
    direcao: 'cima' | 'baixo',
  ): Promise<DashboardWidget[]> {
    const todos = await this.listar();
    const indiceAtual = todos.findIndex((widget) => widget.id === id);
    if (indiceAtual === -1) {
      throw new NotFoundException('Widget não encontrado');
    }

    const indiceAlvo = direcao === 'cima' ? indiceAtual - 1 : indiceAtual + 1;
    if (indiceAlvo < 0 || indiceAlvo >= todos.length) {
      return todos;
    }

    const atual = todos[indiceAtual];
    const alvo = todos[indiceAlvo];
    const ordemAtual = atual.ordem;
    atual.ordem = alvo.ordem;
    alvo.ordem = ordemAtual;
    await this.widgetRepository.save([atual, alvo]);

    return this.listar();
  }

  async remover(id: number): Promise<void> {
    const widget = await this.buscarPorIdOuFalhar(id);
    if (widget.fixo) {
      throw new BadRequestException(
        'Este widget é fixo e não pode ser excluído — desative-o em vez disso',
      );
    }
    await this.widgetRepository.remove(widget);
  }

  private async buscarPorIdOuFalhar(id: number): Promise<DashboardWidget> {
    const widget = await this.widgetRepository.findOne({ where: { id } });
    if (!widget) throw new NotFoundException('Widget não encontrado');
    return widget;
  }
}
