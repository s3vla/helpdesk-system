import { SetMetadata } from '@nestjs/common';
import { TipoUsuario } from '../enums/tipo-usuario.enum';

export const ROLES_KEY = 'roles';

// @SetMetadata anexa um pedacinho de metadado (aqui, a lista de tipos de
// usuário permitidos) na classe/método decorado, sem alterar seu
// comportamento. Esse metadado fica "invisível" até que algo o leia — nesse
// caso é o RolesGuard, via Reflector. É assim que @Roles(TipoUsuario.TECNICO)
// numa rota consegue "conversar" com o guard sem acoplar os dois diretamente.
export const Roles = (...tipos: TipoUsuario[]) => SetMetadata(ROLES_KEY, tipos);
