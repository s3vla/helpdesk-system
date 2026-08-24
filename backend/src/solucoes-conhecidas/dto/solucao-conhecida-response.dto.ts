import { CategoriaChamado } from '../../common/enums/categoria-chamado.enum';
import { SolucaoConhecida } from '../entities/solucao-conhecida.entity';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';

export class SolucaoConhecidaResponseDto {
  id: number;
  chamadoId: number;
  tituloChamado: string;
  descricaoChamado: string;
  categoria: CategoriaChamado;
  comoFoiResolvido: string;
  marcadaComo: boolean;
  imagensUrls: string[];
  dataCriacao: Date;
  resolvidoPor: UsuarioResponseDto | null;
  // Quantos chamados (de qualquer status) já apareceram nessa categoria —
  // não é "quantas soluções catalogadas", é "quão recorrente é esse tipo de
  // problema". Calculado à parte pelo service e injetado aqui na montagem
  // da resposta (ver SolucoesConhecidasService.listar).
  ocorrenciasCategoria: number;
}

export function mapSolucaoParaResposta(
  solucao: SolucaoConhecida,
  ocorrenciasCategoria: number,
): SolucaoConhecidaResponseDto {
  return {
    id: solucao.id,
    chamadoId: solucao.chamado.id,
    tituloChamado: solucao.chamado.titulo,
    descricaoChamado: solucao.chamado.descricao,
    categoria: solucao.categoria,
    comoFoiResolvido: solucao.comoFoiResolvido,
    marcadaComo: solucao.marcadaComo,
    imagensUrls: solucao.imagensUrls,
    dataCriacao: solucao.dataCriacao,
    resolvidoPor: solucao.chamado.tecnicoResponsavel
      ? mapUsuarioParaResposta(solucao.chamado.tecnicoResponsavel)
      : null,
    ocorrenciasCategoria,
  };
}
