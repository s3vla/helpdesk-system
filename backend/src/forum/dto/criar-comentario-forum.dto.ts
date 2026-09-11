import { IsString, MinLength } from 'class-validator';

// POST /forum/:id/comentarios — qualquer usuário autenticado, sem
// distinção de tipo (ver ForumController).
export class CriarComentarioForumDto {
  @IsString()
  @MinLength(1)
  mensagem: string;
}
