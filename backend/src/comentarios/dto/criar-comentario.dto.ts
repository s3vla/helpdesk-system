import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

const MAXIMO_IMAGENS_POR_COMENTARIO = 5;

// `interno` é opcional e, mesmo se vier `true`, o ComentariosService ignora
// esse valor quando quem está comentando é COLABORADOR (força false) — a
// validação de FORMATO fica no DTO, a REGRA de quem pode marcar como
// interno fica no service, que é quem conhece o usuário autenticado.
//
// `texto` é opcional aqui de propósito: um comentário só com imagem (sem
// nenhum texto) é válido. A regra "precisa ter pelo menos um dos dois" é
// checada em ComentariosService.criar, não aqui — é uma regra que envolve
// dois campos ao mesmo tempo, então faz mais sentido no service do que
// espalhada em decorators condicionais no DTO.
export class CriarComentarioDto {
  @IsOptional()
  @IsString()
  texto?: string;

  @IsOptional()
  @IsBoolean()
  interno?: boolean;

  // Preenchidas só depois de upload bem-sucedido em POST /uploads (uma
  // chamada por arquivo) — mesmo fluxo de duas etapas de
  // Chamado.imagensUrls/SolucaoConhecida.imagensUrls. Limite de 5 não
  // existe (ainda) nos outros dois — introduzido aqui de propósito, fora
  // do escopo mexer nos demais.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAXIMO_IMAGENS_POR_COMENTARIO, {
    message: `Envie no máximo ${MAXIMO_IMAGENS_POR_COMENTARIO} imagens por comentário`,
  })
  @IsString({ each: true })
  imagensUrls?: string[];
}
