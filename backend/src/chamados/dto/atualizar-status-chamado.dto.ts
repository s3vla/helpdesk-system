import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { StatusChamado } from '../../common/enums/status-chamado.enum';

// `comoFoiResolvido` é obrigatório pra finalizar SÓ quando o chamado ainda
// não tem uma solução registrada — mas isso depende de estado do banco
// (existe ou não uma SolucaoConhecida pra este chamado), não só do valor de
// outro campo do mesmo corpo da requisição, então não dá pra expressar com
// @ValidateIf aqui. Essa regra fica em ChamadosService.atualizarStatus, que
// é quem sabe se o chamado já tem solução (reabrir e finalizar de novo NÃO
// pede nem grava uma solução nova — ver comentário lá).
export class AtualizarStatusChamadoDto {
  @IsEnum(StatusChamado, { message: 'Status inválido' })
  status: StatusChamado;

  @IsOptional()
  @IsString()
  comoFoiResolvido?: string;

  @IsOptional()
  @IsBoolean()
  marcadaComo?: boolean;

  // Mesma lógica de `imagensUrls` do chamado (CriarChamadoDto): vem do
  // retorno de POST /uploads, um POST por arquivo — esta rota nunca recebe
  // o arquivo em si. Nome diferente de `imagensUrls` (do chamado) de
  // propósito, pra não confundir "prints do erro" com "prints da solução"
  // no corpo da requisição.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagensUrlsSolucao?: string[];
}
