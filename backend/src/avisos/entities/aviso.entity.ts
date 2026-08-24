import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoAviso } from '../../common/enums/tipo-aviso.enum';
import { Usuario } from '../../usuarios/entities/usuario.entity';

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

  @Column({ type: 'text', enum: TipoAviso })
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
  @Column({ type: 'datetime', nullable: true })
  expiraEm: Date | null;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'autorId' })
  autor: Usuario;
}
