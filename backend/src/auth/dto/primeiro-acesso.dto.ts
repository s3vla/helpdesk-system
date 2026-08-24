import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { EmailCorporativo } from '../../common/validators/email-corporativo.decorator';

// Primeiro acesso só cria usuários do tipo COLABORADOR (técnicos são
// cadastrados via seed, ver src/database/seed.service.ts) — por isso não
// existe campo `tipo` aqui: o service decide isso, não quem chama a API.
//
// `departamento` é opcional porque, se não vier, o AuthService preenche com
// um valor padrão (na prática sempre vem — a tela do front deriva do
// prefixo do e-mail, ver departamentoPorEmail.js). `cargo` também é
// opcional: a tela de Primeiro Acesso não pede mais esse campo (removido de
// propósito, a empresa não usa a informação); a coluna no banco já era
// nullable, então contas novas simplesmente ficam sem cargo preenchido.
export class PrimeiroAcessoDto {
  @EmailCorporativo()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres' })
  senha: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe seu nome completo' })
  nome: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsString()
  departamento?: string;
}
