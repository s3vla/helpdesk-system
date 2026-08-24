import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TipoAviso } from '../../common/enums/tipo-aviso.enum';

// PATCH /avisos/:id (TECNICO-only) — todo campo opcional, só atualiza o que
// vier no corpo (mesmo padrão de AtualizarWidgetDto). `expiraEm: null`
// explícito remove a expiração (@IsOptional do class-validator já trata
// null como "pular validação", então passa direto pro service).
export class AtualizarAvisoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  mensagem?: string;

  @IsOptional()
  @IsEnum(TipoAviso)
  tipo?: TipoAviso;

  @IsOptional()
  @IsBoolean()
  fixado?: boolean;

  @IsOptional()
  @IsDateString()
  expiraEm?: string | null;
}
