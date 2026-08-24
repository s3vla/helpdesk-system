import { LogAuditoria } from '../entities/log-auditoria.entity';
import { AcaoAuditoria } from '../../common/enums/acao-auditoria.enum';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';

export class LogAuditoriaResponseDto {
  id: number;
  acao: AcaoAuditoria;
  descricao: string;
  dataHora: Date;
  usuario: UsuarioResponseDto;
}

export function mapLogAuditoriaParaResposta(
  log: LogAuditoria,
): LogAuditoriaResponseDto {
  return {
    id: log.id,
    acao: log.acao,
    descricao: log.descricao,
    dataHora: log.dataHora,
    usuario: mapUsuarioParaResposta(log.usuario),
  };
}
