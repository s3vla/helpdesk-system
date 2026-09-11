import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusSugestao } from '../../common/enums/status-sugestao.enum';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Sugestão do Fórum — qualquer usuário autenticado (COLABORADOR ou
// TECNICO) cria, sem checagem de posse alguma além de "autor sempre vem do
// JWT" (ver ForumController). Sem edição/exclusão nesta primeira versão
// (decisão explícita do plano aprovado, mantém simples) — se um dia isso
// mudar, aí sim entra uma checagem "autor OU técnico".
@Entity()
export class SugestaoForum {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  mensagem: string;

  @Column({
    type: 'enum',
    enum: StatusSugestao,
    default: StatusSugestao.ABERTA,
  })
  status: StatusSugestao;

  @CreateDateColumn()
  criadaEm: Date;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'autorId' })
  autor: Usuario;
}
