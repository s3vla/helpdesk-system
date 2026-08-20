import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CategoriaChamado } from '../../common/enums/categoria-chamado.enum';

export class FiltrosSolucaoDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsEnum(CategoriaChamado, { message: 'Categoria inválida' })
  categoria?: CategoriaChamado;
}
