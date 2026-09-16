import { IsEnum } from 'class-validator';
import { PrioridadeChamado } from '../../common/enums/prioridade-chamado.enum';

// Corpo de PATCH /chamados/:id/prioridade — mesmo formato de
// AtualizarNivelChamadoDto, ver ChamadosService.atualizarPrioridade pra
// quem pode chamar (solicitante OU técnico, nunca outro colaborador) e a
// regra de bloqueio (chamado FINALIZADO).
export class AtualizarPrioridadeChamadoDto {
  @IsEnum(PrioridadeChamado, { message: 'Prioridade inválida' })
  prioridade: PrioridadeChamado;
}
