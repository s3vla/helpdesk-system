import { ComentarioForum } from '../entities/comentario-forum.entity';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';

export class ComentarioForumResponseDto {
  id: number;
  mensagem: string;
  criadoEm: Date;
  autor: UsuarioResponseDto;
}

export function mapComentarioForumParaResposta(
  comentario: ComentarioForum,
): ComentarioForumResponseDto {
  return {
    id: comentario.id,
    mensagem: comentario.mensagem,
    criadoEm: comentario.criadoEm,
    autor: mapUsuarioParaResposta(comentario.autor),
  };
}
