import { DashboardWidget } from '../entities/dashboard-widget.entity';
import { AgruparPor } from '../../common/enums/agrupar-por.enum';
import { TipoMetrica } from '../../common/enums/tipo-metrica.enum';
import { FormatoVisualWidget } from '../../common/enums/formato-visual-widget.enum';

export class WidgetResponseDto {
  id: number;
  titulo: string;
  tipo: TipoMetrica;
  agruparPor: AgruparPor;
  formatoVisual: FormatoVisualWidget;
  limite: number | null;
  ordem: number;
  ativo: boolean;
  fixo: boolean;
}

export function mapWidgetParaResposta(
  widget: DashboardWidget,
): WidgetResponseDto {
  return {
    id: widget.id,
    titulo: widget.titulo,
    tipo: widget.tipo,
    agruparPor: widget.agruparPor,
    formatoVisual: widget.formatoVisual,
    limite: widget.limite,
    ordem: widget.ordem,
    ativo: widget.ativo,
    fixo: widget.fixo,
  };
}
