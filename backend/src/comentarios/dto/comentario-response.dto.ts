import { Comentario } from '../entities/comentario.entity';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';
import { TipoComentario } from '../../common/enums/tipo-comentario.enum';

export class ComentarioResponseDto {
  id: number;
  texto: string;
  interno: boolean;
  imagemUrl: string | null;
  dataCriacao: Date;
  autor: UsuarioResponseDto;
  // true quando quem escreveu era um observador ("Cc") do chamado no
  // momento do comentário — nunca o solicitante original nem um técnico.
  // Usado pro frontend mostrar o rótulo "Cc" ao lado do nome no histórico.
  ehObservador: boolean;
  // COMENTARIO (padrão) ou NIVEL_AJUSTADO (entrada automática de auditoria
  // — ver ChamadosService.reclassificarNivel). Frontend usa isso pra
  // mostrar o histórico de nível separado da conversa, sem depender do
  // texto exato da mensagem automática.
  tipo: TipoComentario;
}

export function mapComentarioParaResposta(
  comentario: Comentario,
): ComentarioResponseDto {
  return {
    id: comentario.id,
    texto: comentario.texto,
    interno: comentario.interno,
    imagemUrl: comentario.imagemUrl,
    dataCriacao: comentario.dataCriacao,
    autor: mapUsuarioParaResposta(comentario.autor),
    ehObservador: comentario.ehObservador,
    tipo: comentario.tipo,
  };
}
