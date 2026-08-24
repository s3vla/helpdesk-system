import { IsInt, IsOptional } from 'class-validator';

// Corpo de PATCH /chamados/:id/atribuir. `tecnicoId` omitido ou `null`
// desatribui o chamado (volta pra "Não atribuído") — @IsOptional() do
// class-validator já trata null/undefined como "vazio" e pula o @IsInt(),
// então os dois casos chegam intactos no service.
export class AtribuirChamadoDto {
  @IsOptional()
  @IsInt({ message: 'tecnicoId deve ser um número' })
  tecnicoId?: number | null;
}
