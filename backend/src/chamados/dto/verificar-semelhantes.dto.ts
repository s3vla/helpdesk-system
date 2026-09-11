import { IsEnum, IsString, MinLength } from 'class-validator';
import { CategoriaChamado } from '../../common/enums/categoria-chamado.enum';

// GET /chamados/verificar-semelhantes?categoria=&texto= — chamado no meio
// do preenchimento do formulário "Abrir chamado" (ainda não existe, sem
// id). `texto` exige um mínimo curto só pra não disparar a busca com uma
// ou duas letras (ruído, sem sinal nenhum de similaridade ainda).
export class VerificarSemelhantesDto {
  @IsEnum(CategoriaChamado, { message: 'Categoria inválida' })
  categoria: CategoriaChamado;

  @IsString()
  @MinLength(5)
  texto: string;
}
