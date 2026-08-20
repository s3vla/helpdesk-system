import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// AuthGuard('jwt') já sabe acionar o JwtStrategy (registrado com o nome
// "jwt" por padrão pela biblioteca) e barrar a requisição com 401 se o token
// não vier, estiver expirado ou for inválido. Herdar dele aqui só serve
// para dar um nome mais descritivo (JwtAuthGuard) para usar nos
// @UseGuards(...) dos controllers.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
