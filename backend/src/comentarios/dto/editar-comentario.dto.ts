import { IsString, MinLength } from 'class-validator';

// PATCH /comentarios/:id — só o texto é editável (imagens ficam fora do
// escopo). Diferente de CriarComentarioDto, aqui `texto` é obrigatório: não
// faz sentido "editar" um comentário pra ficar vazio quando ele só tinha
// texto (e um comentário só-com-imagem não tem UI de edição no frontend).
export class EditarComentarioDto {
  @IsString()
  @MinLength(1)
  texto: string;
}
