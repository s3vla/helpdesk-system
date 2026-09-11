import { IsString, MinLength } from 'class-validator';

// POST /forum — qualquer usuário autenticado (sem @Roles, ver
// ForumController). `autorId` nunca vem do corpo, sempre do JWT.
export class CriarSugestaoDto {
  @IsString()
  @MinLength(1)
  titulo: string;

  @IsString()
  @MinLength(1)
  mensagem: string;
}
