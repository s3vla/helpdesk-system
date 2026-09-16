import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UsuariosService } from '../../usuarios/usuarios.service';

// Throttle de escrita de `ultimaAtividade` — ver comentário no campo, em
// Usuario. 1 minuto: frequente o bastante pra "online agora" (janela de 5
// minutos, ver RelatoriosService) nunca ficar defasado por mais que isso,
// sem gerar um UPDATE a cada requisição de um usuário navegando rápido.
const THROTTLE_ATIVIDADE_MS = 60_000;

// PassportStrategy(Strategy) conecta esta classe à biblioteca Passport (que
// o NestJS usa por baixo dos panos para estratégias de autenticação). O
// @Injectable() de sempre: permite o Nest instanciar e injetar esta classe
// onde for preciso — aqui, dentro do AuthModule.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      // De onde tirar o token da requisição: do cabeçalho
      // "Authorization: Bearer <token>".
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      // passReqToCallback muda a assinatura de `validate` pra receber o
      // Request como primeiro argumento — precisamos dele só pra saber QUAL
      // rota está sendo chamada (ver bloqueio de deveTrocarSenha abaixo).
      passReqToCallback: true,
    });
  }

  // `validate` só roda DEPOIS que o Passport já conferiu a assinatura e a
  // expiração do token — mas um token assinado continua válido até expirar
  // sozinho, mesmo que a conta tenha sido resetada (ver
  // UsuariosService.resetar) ou a senha trocada (PATCH /auth/minha-senha)
  // DEPOIS de emitido. Por isso reconsultamos o usuário aqui a cada
  // requisição, com duas checagens:
  // 1. Conta não existe mais ou está resetada (`senhaHash === null`).
  // 2. A senha mudou desde que ESTE token específico foi assinado
  //    (`senhaVersao` não bate mais com o final do hash atual) — cobre
  //    tanto o reset quanto uma troca de senha comum, inclusive em outra
  //    aba/dispositivo com sessão aberta.
  // Sem isso, alguém com sessão aberta continuaria acessando o sistema até
  // o token expirar sozinho (até 8h), mesmo depois de perder acesso.
  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);
    if (!usuario || usuario.senhaHash === null) {
      throw new UnauthorizedException('Sessão inválida — faça login novamente');
    }
    if (usuario.senhaHash.slice(-16) !== payload.senhaVersao) {
      throw new UnauthorizedException('Sessão inválida — faça login novamente');
    }

    // Bloqueio de verdade do "precisa trocar a senha antes de continuar" —
    // sem isso, era só a TELA que escondia o Painel TI; a API continuava
    // aceitando o token normalmente pra qualquer rota, então a senha de
    // bootstrap do .env dava acesso completo ao sistema por fora da
    // interface (curl, Postman etc.). A única exceção é a própria rota de
    // trocar senha — sem ela, ninguém nessa situação conseguiria sair dela.
    // Path com o prefixo global 'api' (setado em main.ts via
    // setGlobalPrefix) — se um dia esse prefixo mudar, precisa mudar aqui
    // também.
    const ehRotaDeTrocarSenha =
      req.method === 'PATCH' && req.path === '/api/auth/minha-senha';
    if (usuario.deveTrocarSenha && !ehRotaDeTrocarSenha) {
      throw new ForbiddenException(
        'Troque sua senha antes de continuar usando o sistema',
      );
    }

    // Fire-and-forget: NUNCA aguardado, e o catch garante que uma falha
    // aqui (ex: banco momentaneamente fora) não derruba a requisição real
    // que o usuário está esperando — "online agora" é conveniência, não
    // pode virar motivo de erro 500 em rota nenhuma.
    const precisaAtualizarAtividade =
      !usuario.ultimaAtividade ||
      Date.now() - usuario.ultimaAtividade.getTime() > THROTTLE_ATIVIDADE_MS;
    if (precisaAtualizarAtividade) {
      this.usuariosService.registrarAtividade(usuario.id).catch(() => {});
    }

    return payload;
  }
}
