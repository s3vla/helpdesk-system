import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusChamado } from '../../common/enums/status-chamado.enum';
import { NivelChamado } from '../../common/enums/nivel-chamado.enum';
import { CategoriaChamado } from '../../common/enums/categoria-chamado.enum';

// Este DTO descreve query params (?status=...&nivel=...&categoria=...), não
// o corpo da requisição — o NestJS aplica o mesmo ValidationPipe nos dois
// casos, então um `?status=lixo` é rejeitado com 400 do mesmo jeito que um
// campo inválido no body seria.
export class FiltrosChamadoDto {
  @IsOptional()
  @IsEnum(StatusChamado, { message: 'Status inválido' })
  status?: StatusChamado;

  @IsOptional()
  @IsEnum(NivelChamado, { message: 'Nível inválido' })
  nivel?: NivelChamado;

  @IsOptional()
  @IsEnum(CategoriaChamado, { message: 'Categoria inválida' })
  categoria?: CategoriaChamado;

  // Texto livre — filtra por número do chamado (ver
  // ChamadosService.listarTodos) ou por trecho contido em título/descrição.
  // Sem validação de formato: qualquer string é uma busca válida.
  @IsOptional()
  @IsString()
  busca?: string;
}
