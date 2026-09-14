import { IsInt } from 'class-validator';

export class AdicionarMembroDto {
  @IsInt()
  usuarioId: number;
}
