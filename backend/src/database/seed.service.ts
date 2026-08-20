import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import {
  emailTecnicoAutorizado,
  EMAILS_TECNICO_AUTORIZADOS,
} from '../config/emails-autorizados';

const CUSTO_BCRYPT = 12;
// Um técnico por e-mail autorizado (ver src/config/emails-autorizados.ts) —
// hoje são exatamente 2 (suporte@ e ti@), mas o número vem do tamanho da
// lista em vez de um valor fixo, pra nunca ficar dessincronizado dela.
const QUANTIDADE_TECNICOS_SEED = EMAILS_TECNICO_AUTORIZADOS.length;

// Não existe rota de cadastro de técnico (combinado no desenho: técnicos são
// provisionados fora do fluxo normal da API). Este service cria os técnicos
// automaticamente no primeiro start, lendo as credenciais de variáveis de
// ambiente — NUNCA de um valor escrito no código, pra essas credenciais
// (mesmo sendo só de dev) não irem paradas pro Git.
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly configService: ConfigService,
  ) {}

  // OnApplicationBootstrap é um "lifecycle hook" do Nest: o método marcado
  // roda uma única vez, automaticamente, depois que TODOS os módulos da
  // aplicação já terminaram de inicializar — ponto seguro pra mexer no
  // banco, já que a essa altura o TypeORM já criou as tabelas.
  async onApplicationBootstrap() {
    for (let indice = 1; indice <= QUANTIDADE_TECNICOS_SEED; indice++) {
      await this.seedarTecnico(indice);
    }
  }

  private async seedarTecnico(indice: number): Promise<void> {
    const nome = this.configService.get<string>(`SEED_TECNICO_${indice}_NOME`);
    const email = this.configService.get<string>(
      `SEED_TECNICO_${indice}_EMAIL`,
    );
    const senha = this.configService.get<string>(
      `SEED_TECNICO_${indice}_SENHA`,
    );

    if (!nome || !email || !senha) {
      this.logger.warn(
        `Seed do técnico ${indice} pulado — defina SEED_TECNICO_${indice}_NOME/EMAIL/SENHA no seu .env`,
      );
      return;
    }

    // Validação cruzada contra a lista fechada: se alguém configurar o
    // .env com um e-mail que não está em EMAILS_TECNICO_AUTORIZADOS, isso
    // é um erro de configuração — avisamos, mas não criamos a conta, pra
    // nunca existir um técnico "por fora" da lista oficial.
    if (!emailTecnicoAutorizado(email)) {
      this.logger.warn(
        `Seed do técnico ${indice} pulado — "${email}" não está em EMAILS_TECNICO_AUTORIZADOS (src/config/emails-autorizados.ts)`,
      );
      return;
    }

    // Idempotente: se o servidor reiniciar, não tenta recriar um técnico
    // que já existe (e não erra por causa da constraint unique de e-mail).
    const jaExiste = await this.usuariosService.buscarPorEmail(email);
    if (jaExiste) return;

    const senhaHash = await bcrypt.hash(senha, CUSTO_BCRYPT);
    await this.usuariosService.criar({
      nome,
      email: email.toLowerCase(),
      senhaHash,
      cargo: 'Técnico de TI',
      departamento: 'Tecnologia da Informação',
      tipo: TipoUsuario.TECNICO,
      // A senha do .env é só de bootstrap — o frontend força a troca antes
      // de liberar o Painel TI (ver PATCH /auth/minha-senha), então essa
      // senha nunca vira a senha real de uso contínuo do técnico.
      deveTrocarSenha: true,
    });
    this.logger.log(
      `Técnico criado: ${email} (precisa trocar a senha no primeiro login)`,
    );
  }
}
