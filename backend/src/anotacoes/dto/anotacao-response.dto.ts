import { Anotacao } from '../entities/anotacao.entity';

// Sem `usuario` na resposta, mesmo raciocínio de TarefaResponseDto — é
// sempre "minha", nenhuma tela precisa mostrar de quem é.
export class AnotacaoResponseDto {
  id: number;
  conteudo: string;
  criadaEm: Date;
  atualizadaEm: Date;
}

export function mapAnotacaoParaResposta(
  anotacao: Anotacao,
): AnotacaoResponseDto {
  return {
    id: anotacao.id,
    conteudo: anotacao.conteudo,
    criadaEm: anotacao.criadaEm,
    atualizadaEm: anotacao.atualizadaEm,
  };
}
