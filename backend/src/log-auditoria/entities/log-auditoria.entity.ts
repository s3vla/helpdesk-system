import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chamado } from '../../chamados/entities/chamado.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { AcaoAuditoria } from '../../common/enums/acao-auditoria.enum';

// Trilha de auditoria de um chamado — só ações que ALTERAM dado (nunca
// leitura/visualização, ver LogAuditoriaService.registrar e quem chama).
// Sem relação inversa em Chamado/Usuario de propósito: nada mais no sistema
// precisa navegar "logs deste chamado" a partir da entity Chamado — quem
// precisa (GET /chamados/:id/logs) consulta LogAuditoriaService direto.
@Entity()
export class LogAuditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chamado, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chamadoId' })
  chamado: Chamado;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @Column({ type: 'text', enum: AcaoAuditoria })
  acao: AcaoAuditoria;

  // Texto pronto pra exibir (ex: 'Status alterado de "Na fila" para "Em
  // atendimento"') — montado no momento do registro, não recalculado na
  // leitura, então o histórico continua fazendo sentido mesmo se o texto de
  // exibição de algum enum mudar no futuro.
  @Column({ type: 'text' })
  descricao: string;

  @CreateDateColumn()
  dataHora: Date;
}
