import { PalavraChaveN3 } from '../entities/palavra-chave-n3.entity';

export class PalavraChaveN3ResponseDto {
  id: number;
  palavra: string;
  ativo: boolean;
}

export function mapPalavraChaveN3ParaResposta(
  palavraChave: PalavraChaveN3,
): PalavraChaveN3ResponseDto {
  return {
    id: palavraChave.id,
    palavra: palavraChave.palavra,
    ativo: palavraChave.ativo,
  };
}
