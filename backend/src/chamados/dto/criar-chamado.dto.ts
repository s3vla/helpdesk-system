import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PrioridadeChamado } from '../../common/enums/prioridade-chamado.enum';

const MAXIMO_IMAGENS_POR_CHAMADO = 5;

// Repare no que NÃO está aqui: `nivel`, `status`, `solicitanteId`. Nível é
// calculado pela regra de negócio (ChamadosService.criar), status sempre
// começa PARADO, e o solicitante é sempre quem está autenticado no token —
// nenhum desses pode vir do corpo da requisição, senão qualquer cliente da
// API poderia abrir um chamado em nome de outra pessoa ou já finalizado.
export class CriarChamadoDto {
  // Antes desse campo virar um <input> de verdade no formulário, esse valor
  // era sempre inventado no frontend (descricao.slice(0, 65)) — agora vem
  // digitado pelo usuário, mas o limite continua existindo aqui pro backend
  // nunca confiar só na validação client-side (alguém batendo na API
  // direto poderia mandar um título gigante sem isso).
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MaxLength(100, { message: 'Título deve ter no máximo 100 caracteres' })
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
  // recebe o arquivo em si. Limite de 5, mesmo raciocínio (e mesmo número)
  // já aplicado em CriarComentarioDto.imagensUrls.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAXIMO_IMAGENS_POR_CHAMADO, {
    message: `Envie no máximo ${MAXIMO_IMAGENS_POR_CHAMADO} imagens por chamado`,
  })
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
