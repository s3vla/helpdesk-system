import { MapeamentoSetorEmail } from '../entities/mapeamento-setor-email.entity';
import { SetorResponseDto, mapSetorParaResposta } from './setor-response.dto';

export class MapeamentoSetorResponseDto {
  id: number;
  prefixoEmail: string;
  setor: SetorResponseDto;
}

export function mapMapeamentoParaResposta(
  mapeamento: MapeamentoSetorEmail,
): MapeamentoSetorResponseDto {
  return {
    id: mapeamento.id,
    prefixoEmail: mapeamento.prefixoEmail,
    setor: mapSetorParaResposta(mapeamento.setor),
  };
}
