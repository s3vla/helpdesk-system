import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { AGRUPAR_POR_METRICA_VALIDOS } from '../../chamados/dto/metricas-chamado.dto';
import type { AgruparPorMetrica } from '../../chamados/dto/metricas-chamado.dto';
import { TipoMetrica } from '../../common/enums/tipo-metrica.enum';
import { FormatoVisualWidget } from '../../common/enums/formato-visual-widget.enum';

// POST /dashboard/widgets — `agruparPor` reaproveita a mesma lista de
// valores válidos de GET /chamados/metricas (os 6 genéricos), de propósito
// sem AgruparPor.REPETICAO_CATEGORIA: esse widget é exclusivo do seed
// (DashboardWidgetsService.onApplicationBootstrap), não é criável por
// quem usa a tela "Criar Dashboard".
export class CriarWidgetDto {
  @IsString()
  @MinLength(1)
  titulo: string;

  @IsIn(AGRUPAR_POR_METRICA_VALIDOS, {
    message: `agruparPor precisa ser um de: ${AGRUPAR_POR_METRICA_VALIDOS.join(', ')}`,
  })
  agruparPor: AgruparPorMetrica;

  @IsIn([TipoMetrica.CONTAGEM, TipoMetrica.RANKING])
  tipo: TipoMetrica;

  @IsIn([
    FormatoVisualWidget.BARRA,
    FormatoVisualWidget.PIZZA,
    FormatoVisualWidget.LISTA,
  ])
  formatoVisual: FormatoVisualWidget;

  // Só faz sentido quando tipo=ranking — ignorado em silêncio quando
  // tipo=contagem (mesma regra de MetricasChamadoDto.limite).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number;
}
