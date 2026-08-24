import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Bloco de notas de texto livre — SEM nenhuma relação com Chamado nem com
// Tarefa de propósito (feature separada, ver pedido). Mesmo raciocínio de
// privacidade de Tarefa: qualquer tipo de usuário pode ter as próprias,
// sempre privadas — AnotacoesService só busca/edita filtrando por
// `usuario.id === usuarioAtual.sub`, nunca por um id vindo da query/body.
@Entity()
export class Anotacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  conteudo: string;

  @CreateDateColumn()
  criadaEm: Date;

  @UpdateDateColumn()
  atualizadaEm: Date;

  // Sem inverse side em Usuario, mesmo raciocínio de Tarefa.usuario.
  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;
}
