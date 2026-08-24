import { Type } from 'class-transformer';
import {
  IsBoolean,
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

// PATCH /dashboard/widgets/:id — todo campo opcional (só atualiza o que
// vier no corpo). NÃO tem `ordem` aqui de propósito — reordenar é uma troca
// atômica entre dois widgets (ver PATCH /dashboard/widgets/:id/mover), não
// um "set" isolado de campo que faria sentido nesta rota genérica.
//
// `agruparPor` aceita só os 6 valores genéricos (nunca
// AgruparPor.REPETICAO_CATEGORIA) — o frontend evita mandar esse campo ao
// editar o widget fixo de repetição justamente pra nunca cair nesta
// validação.
export class AtualizarWidgetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  @IsOptional()
  @IsIn(AGRUPAR_POR_METRICA_VALIDOS, {
    message: `agruparPor precisa ser um de: ${AGRUPAR_POR_METRICA_VALIDOS.join(', ')}`,
  })
  agruparPor?: AgruparPorMetrica;

  @IsOptional()
  @IsIn([TipoMetrica.CONTAGEM, TipoMetrica.RANKING])
  tipo?: TipoMetrica;

  @IsOptional()
  @IsIn([
    FormatoVisualWidget.BARRA,
    FormatoVisualWidget.PIZZA,
    FormatoVisualWidget.LISTA,
  ])
  formatoVisual?: FormatoVisualWidget;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
