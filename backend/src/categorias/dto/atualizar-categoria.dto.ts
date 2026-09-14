import { IsBoolean, IsOptional } from 'class-validator';

// PATCH /categorias/:id — os dois únicos campos editáveis depois de criada
// (nome nunca muda: é a chave que já pode estar espalhada em chamados e
// soluções antigos, editar geraria confusão sobre "isso é a mesma
// categoria de antes?"). Os dois são independentes — dá pra mandar só um
// dos dois por vez.
export class AtualizarCategoriaDto {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  consideradaRede?: boolean;
}
