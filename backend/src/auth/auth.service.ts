import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { PrimeiroAcessoDto } from './dto/primeiro-acesso.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { mapUsuarioParaResposta } from '../usuarios/dto/usuario-response.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { emailColaboradorAutorizado } from '../config/emails-autorizados';

// Custo do bcrypt: 12 "salt rounds". Cada +1 dobra o tempo de hash — 12 é a
// recomendação atual da OWASP para senha de login interativo (~250-300ms
// por hash nesta máquina), caro o bastante pra inviabilizar força bruta
// offline sem incomodar o usuário real.
const CUSTO_BCRYPT = 12;

// Hash "de mentira" comparado quando o e-mail não existe, só para o login
// gastar aproximadamente o mesmo tempo tanto pra "e-mail não existe" quanto
// para "e-mail existe mas senha errada" — sem isso, um invasor poderia medir
// o tempo de resposta pra descobrir quais e-mails têm conta (timing attack /
// user enumeration).
const HASH_FALSO =
  '$2b$12$C6UzMDM.H6dfI/f/IKcEeOoAoGZLxK1KpMoO5t.LnZ4y1YQ8O2C5u';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    // JwtService vem do @nestjs/jwt e já sabe assinar/verificar tokens com
    // o segredo configurado em AuthModule (via JwtModule.registerAsync).
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarPorEmail(dto.email);
    const senhaConfere = await bcrypt.compare(
      dto.senha,
      usuario?.senhaHash ?? HASH_FALSO,
    );

    if (!usuario || !senhaConfere) {
      // Mensagem genérica de propósito: nunca revelar se foi o e-mail ou a
      // senha que errou — isso ajudaria um invasor a mapear e-mails válidos.
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.gerarRespostaAutenticada(usuario);
  }

  async primeiroAcesso(dto: PrimeiroAcessoDto) {
    // Lista fechada: só quem está em EMAILS_COLABORADOR_AUTORIZADOS pode
    // completar o cadastro, mesmo terminando em @novatechagro.com.br —
    // checado antes de qualquer outra coisa, então nem chega a consultar o
    // banco por um e-mail que nunca poderia ter conta.
    if (!emailColaboradorAutorizado(dto.email)) {
      throw new ForbiddenException(
        'Este e-mail não está autorizado a acessar o sistema. Entre em contato com o TI.',
      );
    }

    const existente = await this.usuariosService.buscarPorEmail(dto.email);

    // Conta ativa (senha já definida) — mensagem genérica de propósito,
    // sem revelar de quem é a conta ou desde quando existe. Não sugerimos
    // "peça reset pro TI" aqui: se essa mensagem mudasse dependendo do
    // estado da conta, alguém poderia usar a resposta pra descobrir quais
    // e-mails da lista já têm dono (o mesmo raciocínio de anti-enumeração
    // já aplicado no login).
    if (existente && existente.senhaHash !== null) {
      throw new ConflictException(
        'Já existe uma conta com este e-mail — faça login em vez de Primeiro Acesso',
      );
    }

    const senhaHash = await bcrypt.hash(dto.senha, CUSTO_BCRYPT);
    const departamento = dto.departamento ?? 'Novatech Agro';

    // Conta resetada (ver UsuariosService.resetar): reaproveita a MESMA
    // linha em vez de criar um usuário novo — assim o histórico de
    // chamados vinculado a esse id continua íntegro.
    const usuario = existente
      ? await this.usuariosService.completarCadastro(existente.id, {
          nome: dto.nome,
          senhaHash,
          cargo: dto.cargo ?? null,
          departamento,
        })
      : await this.usuariosService.criar({
          nome: dto.nome,
          email: dto.email.toLowerCase(),
          senhaHash,
          cargo: dto.cargo ?? null,
          departamento,
          // Primeiro Acesso só existe pro lado do colaborador — técnicos
          // entram via seed (ver src/database/seed.service.ts).
          tipo: TipoUsuario.COLABORADOR,
        });

    return this.gerarRespostaAutenticada(usuario);
  }

  // Qualquer usuário autenticado pode trocar a PRÓPRIA senha — repare que
  // não existe parâmetro de "qual usuário": o id sempre vem de
  // `req.user.sub` (o token de quem está chamando), nunca de um campo do
  // corpo da requisição. Isso torna a rota inerentemente incapaz de mexer
  // na senha de outra pessoa, sem precisar de nenhuma checagem extra de
  // permissão — dono do token só consegue trocar a própria senha por
  // construção.
  async trocarMinhaSenha(usuarioId: number, dto: TrocarSenhaDto) {
    const usuario = await this.usuariosService.buscarPorId(usuarioId);
    // Não deveria acontecer (JwtStrategy já garante que o usuário existe e
    // está ativo antes de chegar aqui), mas o TypeScript não sabe disso.
    if (!usuario)
      throw new UnauthorizedException('Sessão inválida — faça login novamente');

    const senhaAtualConfere = await bcrypt.compare(
      dto.senhaAtual,
      usuario.senhaHash ?? HASH_FALSO,
    );
    if (!senhaAtualConfere) {
      // Aqui SIM podemos ser específicos ("senha atual errada", não uma
      // mensagem genérica) — diferente do login, não há risco de
      // enumeração: quem está chamando já provou ser dono da conta (tem um
      // token válido), então não existe "será que esse e-mail existe?" pra
      // descobrir.
      throw new UnauthorizedException('Senha atual incorreta');
    }

    if (dto.novaSenha !== dto.confirmarNovaSenha) {
      throw new BadRequestException(
        'A nova senha e a confirmação não coincidem',
      );
    }

    const novaSenhaHash = await bcrypt.hash(dto.novaSenha, CUSTO_BCRYPT);
    const atualizado = await this.usuariosService.atualizarSenha(
      usuarioId,
      novaSenhaHash,
    );

    // Reemite o token com a `senhaVersao` nova — sem isso, o PRÓPRIO token
    // que acabou de trocar a senha ficaria invalidado pela verificação em
    // JwtStrategy no próximo request (já que o hash mudou), obrigando a
    // pessoa a logar de novo na hora mesmo tendo acabado de se autenticar
    // corretamente com a senha atual.
    return this.gerarRespostaAutenticada(atualizado);
  }

  private gerarRespostaAutenticada(usuario: Usuario) {
    const payload: JwtPayload = {
      sub: usuario.id,
      tipo: usuario.tipo,
      // Ver comentário em JwtPayload: detecta troca de senha (ou reset)
      // ocorrida depois que este token foi emitido.
      senhaVersao: usuario.senhaHash!.slice(-16),
    };
    return {
      accessToken: this.jwtService.sign(payload),
      usuario: mapUsuarioParaResposta(usuario),
    };
  }
}
