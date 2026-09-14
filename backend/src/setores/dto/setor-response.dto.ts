import { Setor } from '../entities/setor.entity';

export class SetorResponseDto {
  id: number;
  nome: string;
}

export function mapSetorParaResposta(setor: Setor): SetorResponseDto {
  return { id: setor.id, nome: setor.nome };
}
