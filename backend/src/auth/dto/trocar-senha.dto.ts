import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// `senhaAtual` é o que garante que quem está trocando a senha é realmente o
// dono da conta, não alguém que roubou uma sessão aberta (ex: computador
// destravado) — mesmo já autenticado por token, sem a senha atual certa
// isso não passa (ver AuthService.trocarMinhaSenha). A comparação de
// `novaSenha` com `confirmarNovaSenha` acontece no service, não aqui,
// porque não é uma regra de formato do campo — é uma regra que envolve
// dois campos ao mesmo tempo.
export class TrocarSenhaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe sua senha atual' })
  senhaAtual: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha precisa ter pelo menos 8 caracteres' })
  novaSenha: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirme a nova senha' })
  confirmarNovaSenha: string;
}
