import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Chamado } from '../../chamados/entities/chamado.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// "Cc" de um chamado: um colaborador que não é o solicitante, mas tem
// acesso de leitura/comentário ao chamado (ver ObservadoresService — o
// mesmo cuidado de IDOR que protege o solicitante passa a valer também
// pra quem está aqui). Um chamado pode ter vários observadores; um usuário
// pode observar vários chamados — por isso a chave primária própria (`id`),
// em vez de uma chave composta (chamadoId, usuarioId).
@Entity()
@Unique(['chamado', 'usuario'])
export class ChamadoObservador {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chamado, (chamado) => chamado.observadores, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chamadoId' })
  chamado: Chamado;

  // Sem relação inversa em Usuario (ao contrário de chamadosAbertos etc.) —
  // nada hoje precisa navegar de "um usuário" pra "todos os chamados que
  // ele observa" através da entity em si; ObservadoresService.listarChamadoIdsObservados
  // já resolve isso com uma query direta quando GET /chamados/observando precisa.
  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  // Campo que dá nome à funcionalidade ("adicionadoEm") pedido explicitamente
  // no desenho — equivalente a um @CreateDateColumn comum.
  @CreateDateColumn()
  adicionadoEm: Date;
}
