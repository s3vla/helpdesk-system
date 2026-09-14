import { IsInt, IsString, MinLength } from 'class-validator';

// `prefixoEmail` nunca inclui o "@" nem o domínio — só a parte antes,
// sempre normalizada pra minúsculo no service antes de gravar (evita
// "RH" e "rh" virarem duas entradas diferentes por acidente).
export class CriarMapeamentoSetorDto {
  @IsString()
  @MinLength(1)
  prefixoEmail: string;

  @IsInt()
  setorId: number;
}
