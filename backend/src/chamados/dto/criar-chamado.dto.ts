import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoriaChamado } from '../../common/enums/categoria-chamado.enum';
import { PrioridadeChamado } from '../../common/enums/prioridade-chamado.enum';

// Repare no que NÃO está aqui: `nivel`, `status`, `solicitanteId`. Nível é
// calculado pela regra de negócio (ChamadosService.criar), status sempre
// começa PARADO, e o solicitante é sempre quem está autenticado no token —
// nenhum desses pode vir do corpo da requisição, senão qualquer cliente da
// API poderia abrir um chamado em nome de outra pessoa ou já finalizado.
export class CriarChamadoDto {
  @IsString()
  @IsNotEmpty({ message: 'Descreva o problema' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'Descreva o problema' })
  descricao: string;

  @IsOptional()
  @IsString()
  mensagemErro?: string;

  @IsEnum(CategoriaChamado, { message: 'Categoria inválida' })
  categoria: CategoriaChamado;

  @IsEnum(PrioridadeChamado, { message: 'Prioridade inválida' })
  prioridade: PrioridadeChamado;

  // Preenchido só depois de um upload bem-sucedido em POST /uploads — o
  // front sobe o arquivo primeiro, recebe a URL de volta, e só então manda
  // essa URL aqui. Esta rota nunca recebe o arquivo em si.
  @IsOptional()
  @IsString()
  imagemUrl?: string;

  // Sem @Matches nem formato fixo de propósito: o ID do AnyDesk varia (só
  // números, ou com espaços/traços dependendo de como a pessoa copiou da
  // tela do programa) — validação rígida aqui rejeitaria entrada válida à
  // toa. Quem confere se ficou certo é o próprio colaborador, lendo de
  // volta no detalhe do chamado.
  @IsOptional()
  @IsString()
  anydeskId?: string;
}
