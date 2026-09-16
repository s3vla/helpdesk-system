import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Setor } from '../setores/entities/setor.entity';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import {
  calcularPaginacao,
  montarRespostaPaginada,
  RespostaPaginadaDto,
} from '../common/dto/resposta-paginada.dto';

interface CriarUsuarioParams {
  nome: string;
  email: string;
  senhaHash: string;
  // Opcional porque a tela de Primeiro Acesso não coleta mais cargo — a
  // coluna no banco já era nullable, então isso nunca exigiu migração.
  cargo?: string | null;
  // Texto legado, mantido como espelho de `setor?.nome` — ver comentário em
  // Usuario.departamento. Quem chama é sempre quem já derivou o setor (ver
  // AuthService.primeiroAcesso), nunca um valor arbitrário de cliente.
  departamento: string;
  setor: Setor | null;
  tipo: TipoUsuario;
  // Opcional porque só o seed de técnico usa — o valor padrão da coluna
  // (`false`) já cobre todo o resto (colaboradores via Primeiro Acesso
  // nunca usam senha de bootstrap, escolhem a própria senha na hora).
  deveTrocarSenha?: boolean;
}

interface CompletarCadastroParams {
  nome: string;
  senhaHash: string;
  cargo?: string | null;
  departamento: string;
  setor: Setor | null;
  // Explícito (sem default aqui) de propósito: Primeiro Acesso self-service
  // sempre manda `false` (a pessoa escolheu a própria senha, não precisa
  // trocar de novo); cadastro pelo técnico sempre manda `true` (senha
  // inicial escolhida por outra pessoa) — ver AuthService.
  deveTrocarSenha: boolean;
}

// @Injectable é o que permite o NestJS instanciar esta classe e "injetá-la"
// (via constructor) em qualquer outro provider que dependa dela — é o
// mecanismo de Injeção de Dependência do framework. Toda a lógica de acesso
// a dados e regras relacionadas a Usuario vivem aqui, nunca no controller.
@Injectable()
export class UsuariosService {
  // @InjectRepository(Usuario) pede ao NestJS o Repository<Usuario> que o
  // TypeORM registrou para essa entity (feito em UsuariosModule via
  // TypeOrmModule.forFeature). O Repository é quem sabe conversar com a
  // tabela "usuario" — find, save, delete etc.
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async criar(dados: CriarUsuarioParams): Promise<Usuario> {
    const usuario = this.usuarioRepository.create(dados);
    return this.usuarioRepository.save(usuario);
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: { setor: true },
    });
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { id },
      relations: { setor: true },
    });
  }

  // GET /usuarios (tela "Colaboradores" da Área Técnica) só lista quem abre
  // chamado — técnicos não aparecem nessa lista, por isso o filtro por tipo
  // em vez de um `find()` simples. Ordenado por email (nunca nulo,
  // diferente de `nome`, que fica null enquanto a conta está "aguardando
  // cadastro") — garante uma ordem estável entre páginas.
  //
  // `busca`: nome OU e-mail, parcial e case-insensitive (ILike — Postgres
  // resolve o "case-insensitive" nativamente, sem precisar de LOWER() dos
  // dois lados como solucoes-conhecidas.service.ts faz na QueryBuilder).
  // Dois `where` (array = OR) porque `nome` pode ser null numa conta
  // resetada — ILike contra null simplesmente não bate, nunca lança erro.
  async listarColaboradores(
    pagina?: number,
    limite?: number,
    busca?: string,
  ): Promise<RespostaPaginadaDto<Usuario>> {
    const paginacao = calcularPaginacao(pagina, limite);
    const termo = busca?.trim();
    const base: FindOptionsWhere<Usuario> = { tipo: TipoUsuario.COLABORADOR };
    const where: FindOptionsWhere<Usuario> | FindOptionsWhere<Usuario>[] = termo
      ? [
          { ...base, nome: ILike(`%${termo}%`) },
          { ...base, email: ILike(`%${termo}%`) },
        ]
      : base;

    const [usuarios, total] = await this.usuarioRepository.findAndCount({
      where,
      relations: { setor: true },
      order: { email: 'ASC' },
      skip: paginacao.skip,
      take: paginacao.limite,
    });
    return montarRespostaPaginada(
      usuarios,
      total,
      paginacao.pagina,
      paginacao.limite,
    );
  }

  // GET /usuarios/tecnicos — popula o dropdown "Atribuído a" do painel de
  // TI (TicketPanel). Existe separado de listarColaboradores() porque é
  // literalmente o filtro oposto: aqui só quem PODE ser responsável por um
  // chamado, nunca quem abre chamado.
  async listarTecnicos(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: { tipo: TipoUsuario.TECNICO },
    });
  }

  // Preenche uma conta que estava resetada (nome/cargo/senha nulos) com os
  // dados de quem está assumindo aquele e-mail agora — reaproveita a MESMA
  // linha (mesmo id), então o histórico de chamados vinculado a ela nunca
  // se perde. `resetadoEm` volta a null: a conta deixa de estar "aguardando
  // cadastro" e passa a ser uma conta ativa de novo.
  async completarCadastro(
    id: number,
    dados: CompletarCadastroParams,
  ): Promise<Usuario> {
    await this.usuarioRepository.update(id, { ...dados, resetadoEm: null });
    return this.buscarPorId(id) as Promise<Usuario>;
  }

  // Apaga nome/cargo/senha de uma conta de colaborador, liberando o e-mail
  // pra rodar Primeiro Acesso de novo (ver AuthService.primeiroAcesso) — é
  // o mecanismo pra quando um e-mail de cargo (ex: faturamento02@) muda de
  // responsável. Só funciona em conta COLABORADOR: técnicos são
  // provisionados por seed, não por este fluxo.
  async resetar(id: number): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) throw new NotFoundException('Colaborador não encontrado');
    if (usuario.tipo !== TipoUsuario.COLABORADOR) {
      throw new BadRequestException(
        'Só é possível resetar contas de colaborador',
      );
    }

    await this.usuarioRepository.update(id, {
      nome: null,
      cargo: null,
      senhaHash: null,
      resetadoEm: new Date(),
    });
    return this.buscarPorId(id) as Promise<Usuario>;
  }

  // Usado por PATCH /auth/minha-senha (ver AuthService.trocarMinhaSenha) —
  // troca só o hash e zera `deveTrocarSenha`, que é o que faz um técnico
  // recém-seedado parar de ser obrigado a trocar a senha de bootstrap a
  // cada login depois de trocá-la de verdade uma vez.
  async atualizarSenha(id: number, novaSenhaHash: string): Promise<Usuario> {
    await this.usuarioRepository.update(id, {
      senhaHash: novaSenhaHash,
      deveTrocarSenha: false,
    });
    return this.buscarPorId(id) as Promise<Usuario>;
  }

  // Chamado fire-and-forget por JwtStrategy.validate a cada requisição
  // autenticada (já com o throttle de 1 minuto decidido lá, antes de
  // chamar). `.update()` puro (sem buscarPorId depois) de propósito — quem
  // chama não espera nem usa o retorno, então não vale o round-trip extra
  // só pra devolver um Usuario que ninguém lê.
  async registrarAtividade(id: number): Promise<void> {
    await this.usuarioRepository.update(id, { ultimaAtividade: new Date() });
  }
}
