import { IsInt } from 'class-validator';

export class AdicionarObservadorDto {
  @IsInt({ message: 'usuarioId inválido' })
  usuarioId: number;
}
