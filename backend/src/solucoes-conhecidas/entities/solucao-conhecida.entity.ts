import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
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
  // sem precisar fazer JOIN com "chamado" a cada consulta — agora FK, pelo
  // mesmo motivo de Chamado.categoria (era enum fixo, virou tabela
  // administrável). `eager: true` pelo mesmo motivo de lá — muita leitura
  // espalhada que já assumia `solucao.categoria` vindo preenchido sozinho.
  @ManyToOne(() => Categoria, { eager: true, nullable: false })
  @JoinColumn({ name: 'categoriaId' })
  categoria: Categoria;

  // Prints opcionais de "como ficou depois de resolvido" — mesmo padrão de
  // Chamado.imagensUrls (array via `simple-json`, não uma tabela separada:
  // é a abordagem que o projeto já usa pra múltiplos anexos, então reusar
  // aqui em vez de criar uma entity nova é o que mantém consistência).
  // Reaproveita o mesmo UploadsController do print do erro na abertura do
  // chamado (mesmo fluxo de duas etapas: POST /uploads por arquivo,
  // primeiro, depois manda as URLs aqui).
  @Column({ type: 'simple-json', default: '[]' })
  imagensUrls: string[];

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
