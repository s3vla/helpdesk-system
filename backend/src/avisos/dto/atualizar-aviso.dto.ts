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

// PATCH /avisos/:id (TECNICO-only) — todo campo opcional, só atualiza o que
// vier no corpo (mesmo padrão de AtualizarWidgetDto). `expiraEm: null`
// explícito remove a expiração (@IsOptional do class-validator já trata
// null como "pular validação", então passa direto pro service).
//
// `destinatarioTipo` opcional aqui (diferente de CriarAvisoDto, onde é
// obrigatório) — se não vier, o escopo do aviso não muda. Se vier, exige
// `grupoId`/`usuarioId` compatível, mesma checagem de
// AvisosService.validarEscopo.
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

  @IsOptional()
  @IsEnum(DestinatarioAvisoTipo)
  destinatarioTipo?: DestinatarioAvisoTipo;

  @IsOptional()
  @IsInt()
  grupoId?: number;

  @IsOptional()
  @IsInt()
  usuarioId?: number;
}
