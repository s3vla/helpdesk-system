import { TipoAviso } from '../../common/enums/tipo-aviso.enum';
import { DestinatarioAvisoTipo } from '../../common/enums/destinatario-aviso.enum';
import { Aviso } from '../entities/aviso.entity';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';

// Resumo mínimo pro frontend rotular o escopo ("Enviado para: grupo
// Faturamento") sem precisar buscar o grupo/usuário inteiro à parte — não
// reaproveita nenhum outro DTO (GrupoResponseDto traria `membros`, que
// ninguém precisa aqui).
export class GrupoResumoDto {
  id: number;
  nome: string;
}

export class AvisoResponseDto {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: TipoAviso;
  fixado: boolean;
  publicadoEm: Date;
  expiraEm: Date | null;
  autor: UsuarioResponseDto;
  // Calculado por AvisosService.listar a partir de existir (ou não) um
  // AvisoLeitura do usuário autenticado pra este aviso — nunca uma coluna
  // da entity Aviso em si (é por usuário, não do aviso).
  lido: boolean;
  // Contagem de TODOS os usuários que já leram (não só o autenticado) —
  // usado pelo botão "Visto por X pessoas" (só renderizado pro técnico no
  // frontend, mas o campo em si vem sempre; não é dado sensível, só um
  // número). Detalhe de QUEM são vem de GET /avisos/:id/leitores, sob
  // demanda, pra não pesar esta listagem com nomes que a maioria das vezes
  // ninguém vai abrir.
  totalLeitores: number;
  destinatarioTipo: DestinatarioAvisoTipo;
  // Só um dos dois vem preenchido (ou nenhum, se TODOS) — espelha
  // Aviso.grupo/Aviso.usuarioDestinatario. Usado pelo PublicarAvisoModal
  // pra pré-selecionar o escopo ao editar um aviso existente.
  grupoDestinatario: GrupoResumoDto | null;
  usuarioDestinatario: UsuarioResponseDto | null;
}

export function mapAvisoParaResposta(
  aviso: Aviso,
  lido: boolean,
  totalLeitores: number,
): AvisoResponseDto {
  return {
    id: aviso.id,
    titulo: aviso.titulo,
    mensagem: aviso.mensagem,
    tipo: aviso.tipo,
    fixado: aviso.fixado,
    publicadoEm: aviso.publicadoEm,
    expiraEm: aviso.expiraEm,
    autor: mapUsuarioParaResposta(aviso.autor),
    lido,
    totalLeitores,
    destinatarioTipo: aviso.destinatarioTipo,
    grupoDestinatario: aviso.grupo
      ? { id: aviso.grupo.id, nome: aviso.grupo.nome }
      : null,
    usuarioDestinatario: aviso.usuarioDestinatario
      ? mapUsuarioParaResposta(aviso.usuarioDestinatario)
      : null,
  };
}
