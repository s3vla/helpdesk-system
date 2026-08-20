import { IsNotEmpty, IsString } from 'class-validator';
import { EmailCorporativo } from '../../common/validators/email-corporativo.decorator';

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
}
