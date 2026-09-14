import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

// Um registro por LOGIN bem-sucedido (ver AuthService.login) — usado pelo
// relatório "Atividade e Relatórios → Acesso" em Administração, pra saber
// quando cada colaborador acessou o sistema pela última vez. Sem relação
// inversa em Usuario de propósito, mesmo raciocínio de LogAuditoria: nada
// mais no sistema precisa navegar "acessos deste usuário" a partir da
// entity Usuario — quem precisa (RelatoriosService) consulta este
// repositório direto.
@Entity()
export class LogAcesso {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @CreateDateColumn()
  dataHora: Date;

  // Best-effort: vem de `request.ip` no Express — atrás de um proxy/IIS
  // sem "trust proxy" configurado pode refletir o IP do proxy, não do
  // cliente real. Nullable de propósito, é só informativo, nunca crítico
  // pro relatório de "último acesso" (que usa `dataHora`, não este campo).
  @Column({ type: 'text', nullable: true })
  ipOrigem: string | null;
}
