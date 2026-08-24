import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EmailCorporativo } from '../../common/validators/email-corporativo.decorator';
import { TipoUsuario } from '../../common/enums/tipo-usuario.enum';

// DTO = "Data Transfer Object". Existe para descrever exatamente o formato
// de dado que ENTRA numa requisição — é diferente da Entity (que descreve o
// que é guardado no banco). O ValidationPipe global (configurado em
// main.ts) usa os decorators do class-validator abaixo para rejeitar a
// requisição com 400 Bad Request ANTES dela chegar no controller, se algum
// campo estiver fora do formato esperado.
export class LoginDto {
  @EmailCorporativo()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe sua senha' })
  senha: string;

  // Qual área o formulário que originou esta requisição representa
  // (Colaborador ou Área Técnica) — permite ao AuthService recusar o login
  // ANTES de emitir qualquer token quando o `tipo` real do usuário (vindo
  // do banco) não bate com a área tentada, mesmo com e-mail/senha corretos.
  // Sem isso, uma conta de técnico logando pelo formulário de colaborador
  // (ou vice-versa) ganhava uma sessão válida do próprio tipo, e só o
  // frontend "fingia" bloquear depois — nunca impedia de fato.
  @IsEnum(TipoUsuario, { message: 'perfilEsperado inválido' })
  perfilEsperado: TipoUsuario;
}
