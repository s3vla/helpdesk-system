import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Aviso } from './aviso.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Registro de "usuário X já leu o aviso Y" — mesma estrutura de
// ChamadoObservador (chave própria + @Unique composta, em vez de chave
// primária composta). onDelete: 'CASCADE' em `aviso` limpa as leituras
// junto quando um técnico exclui o aviso (DELETE /avisos/:id); sem cascade
// em `usuario` de propósito, um usuário nunca é excluído de verdade no
// sistema (ver Usuario.senhaHash === null / reset de conta).
@Entity()
@Unique(['aviso', 'usuario'])
export class AvisoLeitura {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Aviso, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'avisoId' })
  aviso: Aviso;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @CreateDateColumn()
  lidoEm: Date;
}
