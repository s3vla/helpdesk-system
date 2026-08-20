import { IsInt } from 'class-validator';
import { CriarChamadoDto } from './criar-chamado.dto';

// Mesmo corpo de CriarChamadoDto (POST /chamados normal), só acrescentando
// `solicitanteId` — usado por POST /chamados/tecnico, quando um técnico
// abre um chamado em nome de um colaborador (cenário "colega ligou
// pedindo"). Repare no que continua faltando aqui, herdado da regra do
// DTO normal: `nivel`, `status`, `abertoPorTecnicoId` nunca vêm do corpo —
// nível é calculado, status sempre começa PARADO, e abertoPorTecnicoId é
// sempre o técnico do TOKEN (ver ChamadosController.criarComoTecnico),
// nunca algo que o cliente da API possa forjar.
export class AbrirChamadoTecnicoDto extends CriarChamadoDto {
  @IsInt({ message: 'Informe o solicitante' })
  solicitanteId: number;
}
