import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PrimeiroAcessoDto } from './dto/primeiro-acesso.dto';
import { CadastrarColaboradorDto } from './dto/cadastrar-colaborador.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
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
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, request.ip ?? null);
  }

  @Post('primeiro-acesso')
  @HttpCode(HttpStatus.CREATED)
  // Mesmo limite de login/troca de senha: 5 tentativas por minuto por IP.
  // Faltava aqui antes (auditoria de segurança encontrou o gap) — sem
  // throttle, essa rota permite tentar "reivindicar" qualquer e-mail da
  // lista fechada de colaboradores autorizados sem limite de tentativas,
  // já que não existe confirmação por e-mail antes de ativar a conta.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  primeiroAcesso(@Body() dto: PrimeiroAcessoDto) {
    return this.authService.primeiroAcesso(dto);
  }

  // Só TECNICO — cadastro de colaborador feito direto pela Área Técnica
  // (Administração → Colaboradores), em paralelo ao Primeiro Acesso
  // self-service acima (ver AuthService.cadastrarColaborador pras
  // diferenças). Sem @Throttle específico: já exige um técnico autenticado
  // (JwtAuthGuard + RolesGuard), diferente de login/primeiro-acesso, que
  // são as portas de entrada sem sessão nenhuma — o vetor de força bruta
  // que o throttle ali protege não existe aqui.
  @Post('cadastrar-colaborador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.TECNICO)
  cadastrarColaborador(@Body() dto: CadastrarColaboradorDto) {
    return this.authService.cadastrarColaborador(dto);
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
