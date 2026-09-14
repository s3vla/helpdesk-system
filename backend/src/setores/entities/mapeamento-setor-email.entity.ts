import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Setor } from './setor.entity';

// Substitui DEPARTAMENTO_POR_PREFIXO (antes hardcoded em
// frontend/src/utils/departamentoPorEmail.js) — "prefixoEmail" é a parte
// antes do "@" (ex: "rh", "financeiro"), sempre gravada em minúsculo.
// Único por prefixo: um prefixo só pode apontar pra um setor por vez
// (mesma regra que o arquivo hardcoded já tinha — um objeto JS não deixa
// duas entradas pra mesma chave).
@Entity()
export class MapeamentoSetorEmail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  prefixoEmail: string;

  @ManyToOne(() => Setor, { nullable: false })
  @JoinColumn({ name: 'setorId' })
  setor: Setor;
}
