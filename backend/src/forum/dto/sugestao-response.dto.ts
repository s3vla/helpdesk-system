import { StatusSugestao } from '../../common/enums/status-sugestao.enum';
import { SugestaoForum } from '../entities/sugestao-forum.entity';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';

export class SugestaoResponseDto {
  id: number;
  titulo: string;
  mensagem: string;
  status: StatusSugestao;
  criadaEm: Date;
  autor: UsuarioResponseDto;
  // Calculado por ForumService (query agrupada, mesmo padrão de
  // AvisosService.listar pra `totalLeitores`) — nunca uma coluna da
  // entity, é sempre derivado da tabela de comentários.
  totalComentarios: number;
}

export function mapSugestaoParaResposta(
  sugestao: SugestaoForum,
  totalComentarios: number,
): SugestaoResponseDto {
  return {
    id: sugestao.id,
    titulo: sugestao.titulo,
    mensagem: sugestao.mensagem,
    status: sugestao.status,
    criadaEm: sugestao.criadaEm,
    autor: mapUsuarioParaResposta(sugestao.autor),
    totalComentarios,
  };
}
