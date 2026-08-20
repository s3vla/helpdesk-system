import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PrimeiroAcessoDto } from './dto/primeiro-acesso.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // login/primeiro-acesso não têm @UseGuards(JwtAuthGuard) — faz sentido,
  // ninguém tem token ainda antes de logar.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Sobrescreve, só nesta rota, o limite geral de requisições configurado em
  // AppModule: no máximo 5 tentativas de login por minuto, por IP. Passar
  // disso devolve 429 Too Many Requests em vez de deixar tentar de novo —
  // é a proteção básica contra força bruta de senha.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('primeiro-acesso')
  @HttpCode(HttpStatus.CREATED)
  primeiroAcesso(@Body() dto: PrimeiroAcessoDto) {
    return this.authService.primeiroAcesso(dto);
  }

  // Única rota de auth que EXIGE estar logado — troca a senha da PRÓPRIA
  // conta (colaborador ou técnico, tanto faz — @UsuarioAtual() já garante
  // que só dá pra mexer na conta de quem está autenticado, ver
  // AuthService.trocarMinhaSenha).
  @Patch('minha-senha')
  @UseGuards(JwtAuthGuard)
  // Mesmo limite do login: 5 tentativas por minuto por IP. Essa rota pede
  // "senha atual" como confirmação — se um token vazasse (roubo de sessão,
  // aba esquecida aberta), sem esse limite alguém poderia tentar adivinhar
  // a senha atual por força bruta usando esse token, sem nunca precisar
  // saber a senha de verdade.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  trocarMinhaSenha(
    @UsuarioAtual() usuarioAtual: JwtPayload,
    @Body() dto: TrocarSenhaDto,
  ) {
    return this.authService.trocarMinhaSenha(usuarioAtual.sub, dto);
  }
}
