import { TipoUsuario } from '../enums/tipo-usuario.enum';

// Formato do payload que colocamos dentro do token JWT ao gerar (AuthService)
// e o formato que recebemos de volta em `req.user` depois que o JwtStrategy
// valida o token. `sub` ("subject") é o nome convencional em JWT para "de
// quem é esse token" — aqui é o id do Usuario.
export interface JwtPayload {
  sub: number;
  tipo: TipoUsuario;
  // Pedaço final do senhaHash no momento em que o token foi emitido. Serve
  // só pra JwtStrategy detectar "essa senha já mudou desde que esse token
  // foi assinado" — sem isso, trocar de senha (PATCH /auth/minha-senha) não
  // derrubaria sessões abertas em outros lugares, do mesmo jeito que o
  // reset de conta não derrubava antes de corrigirmos isso.
  senhaVersao: string;
}
