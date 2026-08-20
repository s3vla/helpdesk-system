import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { EmailCorporativo } from '../../common/validators/email-corporativo.decorator';

// Primeiro acesso só cria usuários do tipo COLABORADOR (técnicos são
// cadastrados via seed, ver src/database/seed.service.ts) — por isso não
// existe campo `tipo` aqui: o service decide isso, não quem chama a API.
//
// `departamento` é opcional porque a tela de Primeiro Acesso do front atual
// só pede nome e cargo (ver src/components/FirstAccessModal.jsx do
// frontend) — se não vier, o AuthService preenche com um valor padrão. Isso
// evita quebrar a integração até o formulário do front ganhar esse campo.
export class PrimeiroAcessoDto {
  @EmailCorporativo()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres' })
  senha: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe seu nome completo' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe seu cargo' })
  cargo: string;

  @IsOptional()
  @IsString()
  departamento?: string;
}
