import { IsBoolean, IsOptional, IsString } from 'class-validator';

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

  // Preenchido só depois de um upload bem-sucedido em POST /uploads — mesmo
  // padrão de imagemUrl do chamado e de imagemUrlSolucao da finalização.
  @IsOptional()
  @IsString()
  imagemUrl?: string;
}
