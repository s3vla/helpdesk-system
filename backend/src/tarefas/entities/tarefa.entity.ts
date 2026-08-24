import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusTarefa } from '../../common/enums/status-tarefa.enum';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Bloco de notas pessoal com status — sem NENHUMA relação com Chamado de
// propósito (ver pedido da feature: é uma lista própria da pessoa, não
// "tarefas de um chamado"). Qualquer tipo de usuário pode ter as suas
// (colaborador e técnico), sempre privadas — TarefasService só busca/edita
// filtrando por `usuario.id === usuarioAtual.sub`, nunca por um id vindo da
// query/body, mesmo cuidado de IDOR já aplicado em Chamado.solicitante.
@Entity()
export class Tarefa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'text', enum: StatusTarefa, default: StatusTarefa.A_FAZER })
  status: StatusTarefa;

  @CreateDateColumn()
  criadaEm: Date;

  @UpdateDateColumn()
  atualizadaEm: Date;

  // Sem inverse side em Usuario de propósito — mesmo raciocínio de
  // Chamado.abertoPorTecnico: nada mais no sistema precisa navegar "tarefas
  // deste usuário" a partir do Usuario, TarefasService já resolve isso
  // direto com uma query filtrada.
  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
}
