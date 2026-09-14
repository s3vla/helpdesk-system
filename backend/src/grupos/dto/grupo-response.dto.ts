import { Grupo } from '../entities/grupo.entity';
import {
  UsuarioResponseDto,
  mapUsuarioParaResposta,
} from '../../usuarios/dto/usuario-response.dto';

export class GrupoResponseDto {
  id: number;
  nome: string;
  membros: UsuarioResponseDto[];
}

// Reaproveita mapUsuarioParaResposta pros membros — mesma garantia de nunca
// vazar senhaHash, sem duplicar a lógica de mapeamento aqui.
export function mapGrupoParaResposta(grupo: Grupo): GrupoResponseDto {
  return {
    id: grupo.id,
    nome: grupo.nome,
    membros: grupo.membros.map(mapUsuarioParaResposta),
  };
}
