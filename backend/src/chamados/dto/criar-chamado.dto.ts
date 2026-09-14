import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
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

  // Era @IsEnum(CategoriaChamado) — agora é o NOME de uma categoria
  // cadastrada em Administração → Categorias (string livre, sem lista
  // fechada aqui no DTO). A existência/ativação de verdade é checada no
  // service (CategoriasService.buscarAtivaPorNomeOuFalhar), não aqui —
  // mesmo padrão de EMAILS_COLABORADOR_AUTORIZADOS, que também não é uma
  // regra de formato, e sim de negócio.
  @IsString()
  @IsNotEmpty({ message: 'Escolha uma categoria' })
  categoria: string;

  @IsEnum(PrioridadeChamado, { message: 'Prioridade inválida' })
  prioridade: PrioridadeChamado;

  // Preenchida só depois de um ou mais uploads bem-sucedidos em POST
  // /uploads — o front sobe cada arquivo primeiro (um POST por arquivo),
  // recebe a URL de volta, e só então manda a lista aqui. Esta rota nunca
  // recebe o arquivo em si.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagensUrls?: string[];

  // Sem @Matches nem formato fixo de propósito: o ID do AnyDesk varia (só
  // números, ou com espaços/traços dependendo de como a pessoa copiou da
  // tela do programa) — validação rígida aqui rejeitaria entrada válida à
  // toa. Quem confere se ficou certo é o próprio colaborador, lendo de
  // volta no detalhe do chamado.
  @IsOptional()
  @IsString()
  anydeskId?: string;
}
