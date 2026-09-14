import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoUsuario } from '../../common/enums/tipo-usuario.enum';
import { Chamado } from '../../chamados/entities/chamado.entity';
import { Comentario } from '../../comentarios/entities/comentario.entity';
import { Setor } from '../../setores/entities/setor.entity';

// @Entity marca a classe como uma tabela do banco — o TypeORM lê essa classe
// e (com `synchronize: true`, só em dev) cria/ajusta a tabela "usuario"
// automaticamente a partir dela. Colaboradores e técnicos são a MESMA
// tabela, diferenciados pela coluna `tipo` — é por isso que não existem
// classes `Colaborador`/`Tecnico` separadas.
@Entity()
export class Usuario {
  // @PrimaryGeneratedColumn cria a chave primária autoincremental (1, 2, 3…)
  // — o "id" que identifica a linha de forma única na tabela.
  @PrimaryGeneratedColumn()
  id: number;

  // Nulo enquanto a conta está "resetada" (ver campo `resetadoEm` abaixo) —
  // e-mails de cargo (ex: faturamento02@) podem ser reaproveitados por outra
  // pessoa; ao resetar, nome/cargo/senha somem e o e-mail volta a aceitar
  // Primeiro Acesso, reusando esta MESMA linha (nunca cria outra) — assim
  // o histórico de chamados (que referencia este id) nunca fica órfão.
  @Column({ type: 'text', nullable: true })
  nome: string | null;

  // `unique: true` faz o próprio banco recusar um segundo usuário com o
  // mesmo e-mail (constraint UNIQUE) — é uma segunda camada de proteção
  // além da validação que o DTO já faz na entrada da requisição.
  @Column({ unique: true })
  email: string;

  // Nulo = conta resetada, aguardando alguém completar o Primeiro Acesso de
  // novo. Nunca guardamos a senha em texto puro — só o hash gerado pelo
  // bcrypt (ver AuthService).
  @Column({ type: 'text', nullable: true })
  senhaHash: string | null;

  @Column({ type: 'text', nullable: true })
  cargo: string | null;

  // Preenchida pelo UsuariosService.resetar() com a data/hora do reset — só
  // metadado informativo (pra um técnico ver "resetado há 3 dias" no
  // painel); quem decide se a conta está "aguardando cadastro" de verdade é
  // `senhaHash === null`, não este campo.
  @Column({ type: 'timestamp', nullable: true })
  resetadoEm: Date | null;

  // true pros técnicos criados por seed (ver seed.service.ts) E pros
  // colaboradores cadastrados direto pelo técnico (ver
  // AuthService.cadastrarColaborador) — nos dois casos, a senha foi
  // escolhida por OUTRA pessoa, então é só "de bootstrap", não a senha real
  // de uso. Colaborador via Primeiro Acesso self-service nunca passa por
  // aqui como true — escolheu a própria senha, não precisa trocar de novo.
  // App.jsx força a tela de troca de senha (pra qualquer tipo de usuário)
  // enquanto isso for true; PATCH /auth/minha-senha zera esta flag.
  @Column({ default: false })
  deveTrocarSenha: boolean;

  // LEGADO — era texto livre, confiado do que o FRONTEND mandava no
  // Primeiro Acesso (nunca derivado no servidor, uma lacuna real
  // descoberta ao planejar Setor). Mantida por enquanto como espelho do
  // nome do `setor` abaixo (sempre escrita junto, nunca mais lida
  // sozinha em código novo) — só pra não quebrar a constraint NOT NULL
  // existente sem uma migration extra; candidata a ser removida numa
  // limpeza futura, depois que `setor` estiver com cobertura completa.
  @Column()
  departamento: string;

  // Derivado no SERVIDOR a partir do prefixo do e-mail (ver
  // SetoresService.buscarSetorPorEmail, consultado em
  // AuthService.primeiroAcesso) — nunca mais um valor que o cliente possa
  // simplesmente mandar no corpo da requisição. Nullable: contas cujo
  // prefixo de e-mail não tem mapeamento cadastrado (ou usuários TECNICO,
  // que não passam pelo Primeiro Acesso) ficam sem setor até alguém
  // cadastrar o mapeamento e rodar o backfill (ver
  // src/scripts/preencher-setor-por-prefixo.ts).
  @ManyToOne(() => Setor, { nullable: true })
  @JoinColumn({ name: 'setorId' })
  setor: Setor | null;

  // `type: 'enum'` + `enum:` cria um tipo ENUM nativo do Postgres pra essa
  // coluna (CREATE TYPE ... AS ENUM), com o próprio Postgres rejeitando
  // qualquer valor fora de TipoUsuario — não é só validação da aplicação.
  @Column({ type: 'enum', enum: TipoUsuario })
  tipo: TipoUsuario;

  // @OneToMany não cria coluna nenhuma nessa tabela — é só a "outra ponta"
  // do relacionamento declarado com @ManyToOne lá em Chamado/Comentario,
  // usada quando queremos navegar de um Usuario para os chamados/comentários
  // dele (ex: `usuario.chamadosAbertos`) sem escrever o JOIN manualmente.
  @OneToMany(() => Chamado, (chamado) => chamado.solicitante)
  chamadosAbertos: Chamado[];

  @OneToMany(() => Chamado, (chamado) => chamado.tecnicoResponsavel)
  chamadosAtendidos: Chamado[];

  @OneToMany(() => Comentario, (comentario) => comentario.autor)
  comentarios: Comentario[];
}
