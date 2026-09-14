import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Grupo é PURAMENTE organizacional por enquanto — só agrupa usuários
// (colaboradores ou técnicos, sem restrição de tipo) pra facilitar
// referência humana ("time de Faturamento", "N2 de Rede"). Decisão
// explícita: nenhuma lógica funcional em cima disso ainda (não roteia
// chamado, não define permissão, não filtra nada) — se um dia precisar,
// isso é decisão separada, não implementada aqui.
//
// M2M dono deste lado (Grupo → Usuario via @JoinTable) de propósito: a
// entity Usuario não precisa saber de Grupo pra nada hoje, então não
// ganhou uma propriedade `grupos` — evita tocar num arquivo tão
// referenciado só pra uma relação que, por ora, só é navegada a partir do
// Grupo (GruposService sempre carrega `membros`, nunca o inverso).
@Entity()
export class Grupo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  @ManyToMany(() => Usuario)
  @JoinTable({
    name: 'grupo_membros',
    joinColumn: { name: 'grupoId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'usuarioId', referencedColumnName: 'id' },
  })
  membros: Usuario[];
}
