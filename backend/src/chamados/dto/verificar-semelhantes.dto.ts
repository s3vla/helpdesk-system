import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// GET /chamados/verificar-semelhantes?categoria=&texto= — chamado no meio
// do preenchimento do formulário "Abrir chamado" (ainda não existe, sem
// id). `texto` exige um mínimo curto só pra não disparar a busca com uma
// ou duas letras (ruído, sem sinal nenhum de similaridade ainda).
export class VerificarSemelhantesDto {
  @IsString()
  @IsNotEmpty({ message: 'Escolha uma categoria' })
  categoria: string;

  @IsString()
  @MinLength(5)
  texto: string;
}
