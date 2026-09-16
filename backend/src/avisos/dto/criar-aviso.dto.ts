import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TipoAviso } from '../../common/enums/tipo-aviso.enum';
import { DestinatarioAvisoTipo } from '../../common/enums/destinatario-aviso.enum';

// POST /avisos (TECNICO-only, ver AvisosController). `expiraEm` chega como
// string "YYYY-MM-DDTHH:mm" (valor cru de <input type="datetime-local">,
// SEM sufixo "Z") — @IsDateString aceita esse formato parcial; a conversão
// pra Date acontece em AvisosService.criar, interpretando como horário
// LOCAL do servidor (não UTC) de propósito, ver comentário em Aviso.expiraEm.
//
// `destinatarioTipo` decide qual de `grupoId`/`usuarioId` é obrigatório —
// os dois ficam `@IsOptional()` aqui porque essa exclusividade depende de
// OUTRO campo (não dá pra expressar com class-validator sozinho de forma
// legível); a checagem de verdade é feita em AvisosService.validarEscopo.
export class CriarAvisoDto {
  @IsString()
  @MinLength(1)
  titulo: string;

  @IsString()
  @MinLength(1)
  mensagem: string;

  @IsEnum(TipoAviso)
  tipo: TipoAviso;

  @IsOptional()
  @IsBoolean()
  fixado?: boolean;

  @IsOptional()
  @IsDateString()
  expiraEm?: string;

  @IsEnum(DestinatarioAvisoTipo)
  destinatarioTipo: DestinatarioAvisoTipo;

  @IsOptional()
  @IsInt()
  grupoId?: number;

  @IsOptional()
  @IsInt()
  usuarioId?: number;
}
