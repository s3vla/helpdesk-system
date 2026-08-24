import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CategoriaChamado } from '../../common/enums/categoria-chamado.enum';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

export class FiltrosSolucaoDto extends PaginacaoDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsEnum(CategoriaChamado, { message: 'Categoria inválida' })
  categoria?: CategoriaChamado;
}
