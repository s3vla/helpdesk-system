import { IsEnum } from 'class-validator';
import { StatusSugestao } from '../../common/enums/status-sugestao.enum';

// PATCH /forum/:id/status — TECNICO-only (ver ForumController/RolesGuard).
export class AtualizarStatusSugestaoDto {
  @IsEnum(StatusSugestao)
  status: StatusSugestao;
}
