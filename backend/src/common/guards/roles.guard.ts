import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TipoUsuario } from '../enums/tipo-usuario.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// @Injectable marca a classe como um "provider" — algo que o NestJS sabe
// como instanciar e injetar em outras classes (aqui, o próprio Nest injeta
// isso quando a rota usa @UseGuards(RolesGuard)). Um Guard decide, antes do
// controller rodar, se a requisição pode passar (retorna true) ou é
// rejeitada (retorna false, vira 403 Forbidden).
//
// Esse guard SEMPRE roda depois do JwtAuthGuard (ver ordem em cada
// controller) — ele não valida o token, só verifica se o tipo do usuário já
// autenticado (`request.user.tipo`) está entre os tipos exigidos pelo
// @Roles(...) da rota. Se a rota não tiver @Roles nenhum, deixa passar
// qualquer usuário autenticado.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const tiposPermitidos = this.reflector.getAllAndOverride<TipoUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!tiposPermitidos || tiposPermitidos.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const usuario = request.user as JwtPayload | undefined;

    return !!usuario && tiposPermitidos.includes(usuario.tipo);
  }
}
