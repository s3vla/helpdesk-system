import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { EmailCorporativo } from '../../common/validators/email-corporativo.decorator';

// Cadastro de colaborador feito DIRETO pelo técnico (Administração →
// Colaboradores), em paralelo ao Primeiro Acesso self-service — as duas
// formas de criar uma conta de colaborador continuam existindo (decisão
// aprovada no plano). Diferença chave: aqui só o DOMÍNIO do e-mail é
// validado (@EmailCorporativo), nunca a lista fechada
// EMAILS_COLABORADOR_AUTORIZADOS — a própria ação do técnico de cadastrar
// já é a autorização, então essa lista simplesmente não entra nesse fluxo
// (ver AuthService.cadastrarColaborador).
export class CadastrarColaboradorDto {
  @EmailCorporativo()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o nome completo do colaborador' })
  nome: string;

  // Senha INICIAL escolhida pelo técnico — o colaborador é obrigado a
  // trocá-la no primeiro login (deveTrocarSenha: true), mesmo mecanismo já
  // usado pros técnicos criados por seed (ver seed.service.ts).
  @IsString()
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres' })
  senha: string;

  @IsOptional()
  @IsString()
  cargo?: string;
}
