import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoAviso } from '../../common/enums/tipo-aviso.enum';
import { DestinatarioAvisoTipo } from '../../common/enums/destinatario-aviso.enum';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Grupo } from '../../grupos/entities/grupo.entity';

// Comunicado do Mural de Avisos — só técnico publica (ver AvisosController),
// mas qualquer usuário autenticado lê (GET /avisos). Sem inverse side em
// Usuario de propósito, mesmo raciocínio de Chamado.abertoPorTecnico: nada
// hoje precisa navegar de "um técnico" pra "avisos que ele publicou".
@Entity()
export class Aviso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  mensagem: string;

  @Column({ type: 'enum', enum: TipoAviso })
  tipo: TipoAviso;

  // Fixados aparecem sempre no topo (ver AvisosService.listar), mesmo com
  // avisos mais recentes publicados depois.
  @Column({ default: false })
  fixado: boolean;

  @CreateDateColumn()
  publicadoEm: Date;

  // Nulo = nunca expira. Quando preenchido, some da listagem ATIVA (GET
  // /avisos sem incluirExpirados) assim que passar da data/hora, mas
  // continua na tabela — histórico acessível só pro técnico via
  // ?incluirExpirados=true. Construído em AvisosService a partir de uma
  // string SEM sufixo "Z" (horário local, mesmo cuidado de
  // ChamadosService.resolverPeriodo) — nunca via toISOString(), que
  // converteria pra UTC e desalinharia do horário de parede que o técnico
  // escolheu no formulário.
  @Column({ type: 'timestamp', nullable: true })
  expiraEm: Date | null;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'autorId' })
  autor: Usuario;

  // Escopo de visibilidade — TODOS (padrão, comportamento de sempre) vê
  // qualquer colaborador; GRUPO/USUARIO restringem a quem pertence ao
  // grupo ou é exatamente aquele usuário (ver AvisosService.listar,
  // .contarNaoLidos e .marcarLido, os 3 lugares que aplicam esse filtro).
  // Técnico nunca é filtrado por isso — sempre vê todo aviso, de qualquer
  // escopo, pra poder gerenciar.
  @Column({
    type: 'enum',
    enum: DestinatarioAvisoTipo,
    default: DestinatarioAvisoTipo.TODOS,
  })
  destinatarioTipo: DestinatarioAvisoTipo;

  // Só preenchido quando destinatarioTipo = GRUPO — validado em
  // AvisosService.criar/atualizar, nunca só pela nulabilidade da coluna.
  @ManyToOne(() => Grupo, { nullable: true })
  @JoinColumn({ name: 'grupoId' })
  grupo: Grupo | null;

  // Só preenchido quando destinatarioTipo = USUARIO — mesmo raciocínio de
  // `grupo` acima.
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuarioId' })
  usuarioDestinatario: Usuario | null;
}
