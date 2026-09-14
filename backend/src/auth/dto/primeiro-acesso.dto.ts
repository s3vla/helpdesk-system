import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { EmailCorporativo } from '../../common/validators/email-corporativo.decorator';

// Primeiro acesso só cria usuários do tipo COLABORADOR (técnicos são
// cadastrados via seed, ver src/database/seed.service.ts) — por isso não
// existe campo `tipo` aqui: o service decide isso, não quem chama a API.
//
// Não existe mais campo `departamento` aqui: o setor é derivado no SERVIDOR
// a partir do prefixo do e-mail (ver AuthService.primeiroAcesso e
// SetoresService.buscarSetorPorEmail) — o cliente não tem mais como
// influenciar esse valor. `cargo` é opcional: a tela de Primeiro Acesso não
// pede mais esse campo (removido de propósito, a empresa não usa a
// informação); a coluna no banco já era nullable, então contas novas
// simplesmente ficam sem cargo preenchido.
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
}
