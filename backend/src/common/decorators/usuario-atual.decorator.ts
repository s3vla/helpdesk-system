import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// createParamDecorator cria um decorator de PARÂMETRO (usado dentro da
// assinatura de um método do controller, ex: `metodo(@UsuarioAtual() u)`).
// Ele só existe para não repetir `req.user as JwtPayload` em toda rota
// protegida — o JwtStrategy já deixou o payload do token em `req.user`
// (ver jwt.strategy.ts), aqui só extraímos e tipamos.
export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as JwtPayload;
  },
);
