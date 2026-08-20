import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoriaChamado } from '../../common/enums/categoria-chamado.enum';
import { Chamado } from '../../chamados/entities/chamado.entity';

@Entity()
export class SolucaoConhecida {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  comoFoiResolvido: string;

  // Nome mantido igual ao combinado no desenho: indica se o técnico marcou
  // essa resolução como "solução conhecida" (reaproveitável para casos
  // parecidos) — sempre existe um registro aqui quando o chamado é
  // finalizado, mas só entra na busca de /solucoes-conhecidas quando true.
  @Column({ default: false })
  marcadaComo: boolean;

  // Categoria copiada do chamado no momento da criação (denormalização
  // proposital) para permitir filtrar por categoria em /solucoes-conhecidas
  // sem precisar fazer JOIN com "chamado" a cada consulta.
  @Column({ type: 'text', enum: CategoriaChamado })
  categoria: CategoriaChamado;

  // Print opcional de "como ficou depois de resolvido" — reaproveita o
  // mesmo UploadsController usado no print do erro na abertura do chamado
  // (mesmo fluxo de duas etapas: POST /uploads primeiro, depois manda a
  // URL aqui).
  @Column({ type: 'text', nullable: true })
  imagemUrl: string | null;

  @CreateDateColumn()
  dataCriacao: Date;

  // @OneToOne + `unique: true` na coluna de junção garante, no nível do
  // banco, que um chamado nunca tem mais de um registro de solução — só faz
  // sentido existir um "como foi resolvido" por chamado.
  @OneToOne(() => Chamado, (chamado) => chamado.solucaoConhecida, {
    nullable: false,
  })
  @JoinColumn({ name: 'chamadoId' })
  chamado: Chamado;
}
