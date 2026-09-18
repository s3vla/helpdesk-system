import { IsString, MinLength } from 'class-validator';

// Corpo de PATCH /chamados/:id/categoria — string (nome), igual
// CriarChamadoDto.categoria, não enum: categoria é administrável em
// Administração → Categorias, não um conjunto fixo de valores. Mesma regra
// de quem pode chamar (solicitante OU técnico, nunca outro colaborador) e
// bloqueio (chamado FINALIZADO) de AtualizarPrioridadeChamadoDto, ver
// ChamadosService.atualizarCategoria.
export class AtualizarCategoriaChamadoDto {
  @IsString()
  @MinLength(1)
  categoria: string;
}
