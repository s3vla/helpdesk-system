import { TipoAviso } from '../../common/enums/tipo-aviso.enum';
import { Aviso } from '../entities/aviso.entity';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';

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
  };
}
