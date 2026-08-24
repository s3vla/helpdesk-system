import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TipoAviso } from '../../common/enums/tipo-aviso.enum';

// POST /avisos (TECNICO-only, ver AvisosController). `expiraEm` chega como
// string "YYYY-MM-DDTHH:mm" (valor cru de <input type="datetime-local">,
// SEM sufixo "Z") — @IsDateString aceita esse formato parcial; a conversão
// pra Date acontece em AvisosService.criar, interpretando como horário
// LOCAL do servidor (não UTC) de propósito, ver comentário em Aviso.expiraEm.
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
}
