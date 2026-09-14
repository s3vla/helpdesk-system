import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusChamado } from '../../common/enums/status-chamado.enum';
import { NivelChamado } from '../../common/enums/nivel-chamado.enum';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

// Este DTO descreve query params (?status=...&nivel=...&categoria=...), não
// o corpo da requisição — o NestJS aplica o mesmo ValidationPipe nos dois
// casos, então um `?status=lixo` é rejeitado com 400 do mesmo jeito que um
// campo inválido no body seria. `extends PaginacaoDto` adiciona
// ?pagina=&limite= sem repetir os dois campos aqui.
export class FiltrosChamadoDto extends PaginacaoDto {
  @IsOptional()
  @IsEnum(StatusChamado, { message: 'Status inválido' })
  status?: StatusChamado;

  @IsOptional()
  @IsEnum(NivelChamado, { message: 'Nível inválido' })
  nivel?: NivelChamado;

  // Nome da categoria — sem @IsEnum: não é mais uma lista fechada em
  // código. Um nome inexistente simplesmente não bate com nenhum chamado
  // (WHERE categoria.nome = '...' sem resultado), não é um 400.
  @IsOptional()
  @IsString()
  categoria?: string;

  // Texto livre — filtra por número do chamado (ver
  // ChamadosService.listarTodos) ou por trecho contido em título/descrição.
  // Sem validação de formato: qualquer string é uma busca válida.
  @IsOptional()
  @IsString()
  busca?: string;
}
