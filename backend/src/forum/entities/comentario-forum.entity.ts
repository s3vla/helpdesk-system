import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SugestaoForum } from './sugestao-forum.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// onDelete: 'CASCADE' em `sugestao` — não existe rota de exclusão de
// sugestão hoje, mas se uma for adicionada depois, os comentários somem
// junto automaticamente, sem precisar de um passo manual extra (mesmo
// padrão de AvisoLeitura.aviso e Comentario.chamado). Sem cascade em
// `autor`, mesmo motivo: usuário nunca é excluído de verdade no sistema.
@Entity()
export class ComentarioForum {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  mensagem: string;

  @CreateDateColumn()
  criadoEm: Date;

  @ManyToOne(() => SugestaoForum, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sugestaoId' })
  sugestao: SugestaoForum;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'autorId' })
  autor: Usuario;
}
