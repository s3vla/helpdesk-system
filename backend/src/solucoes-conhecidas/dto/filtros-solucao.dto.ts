import { IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

export class FiltrosSolucaoDto extends PaginacaoDto {
  @IsOptional()
  @IsString()
  busca?: string;

  // Nome da categoria — sem @IsEnum, mesmo motivo de FiltrosChamadoDto.
  @IsOptional()
  @IsString()
  categoria?: string;
}
