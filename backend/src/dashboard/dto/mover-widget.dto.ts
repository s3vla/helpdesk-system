import { IsIn } from 'class-validator';

// PATCH /dashboard/widgets/:id/mover — troca a `ordem` do widget com a do
// vizinho adjacente na direção pedida (ver DashboardWidgetsService.mover).
export class MoverWidgetDto {
  @IsIn(['cima', 'baixo'])
  direcao: 'cima' | 'baixo';
}
