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
import { TipoComentario } from '../../common/enums/tipo-comentario.enum';

@Entity()
export class Comentario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  texto: string;

  // COMENTARIO (padrão) = escrito por alguém. NIVEL_AJUSTADO = entrada
  // automática de auditoria gerada por ChamadosService.reclassificarNivel.
  // O frontend usa isso pra separar o histórico de nível da conversa de
  // verdade — de propósito um campo próprio, não inferido pelo texto (ver
  // TipoComentario), pra não depender do texto da mensagem automática nunca
  // mudar.
  @Column({
    type: 'enum',
    enum: TipoComentario,
    default: TipoComentario.COMENTARIO,
  })
  tipo: TipoComentario;

  // Comentário interno só é visível para técnicos (filtrado em
  // ComentariosService.listarPorChamado) — colaborador nunca vê interno=true
  // nem consegue criar um comentário marcado como interno.
  @Column({ default: false })
  interno: boolean;

  // Mesmo fluxo de duas etapas dos outros uploads (chamado, solução
  // conhecida): sobe cada arquivo em POST /uploads primeiro, referencia as
  // URLs aqui depois. Se `interno: true`, as imagens somem pro colaborador
  // junto com o resto do comentário — mesma checagem de ComentariosService,
  // não precisa de regra própria. `simple-json` em vez de tabela própria —
  // mesmo padrão já usado em Chamado.imagensUrls/SolucaoConhecida.
  // imagensUrls (era `imagemUrl` único até a migration
  // AdicionarImagensMultiplasComentario). Limite de 5 é validado em
  // CriarComentarioDto, não aqui.
  @Column({ type: 'simple-json', default: '[]' })
  imagensUrls: string[];

  // Registrado no momento da criação (não recalculado depois) — se o autor
  // for removido como observador mais tarde, o comentário antigo continua
  // marcando corretamente que, QUANDO ele escreveu, era um observador (não
  // o solicitante). Usado pro frontend mostrar o rótulo "Cc" no histórico.
  // Sempre `false` pra comentários de técnico ou do próprio solicitante.
  @Column({ default: false })
  ehObservador: boolean;

  @CreateDateColumn()
  dataCriacao: Date;

  // Preenchido só quando o comentário é editado (ver ComentariosService.editar)
  // — null significa "nunca editado". Usado tanto pro frontend mostrar
  // "(editado)" quanto como registro de que o texto original mudou (o
  // texto anterior em si não fica guardado, só o fato + quando).
  @Column({ type: 'timestamp', nullable: true })
  editadoEm: Date | null;

  @ManyToOne(() => Chamado, (chamado) => chamado.comentarios, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chamadoId' })
  chamado: Chamado;

  @ManyToOne(() => Usuario, (usuario) => usuario.comentarios, {
    nullable: false,
  })
  @JoinColumn({ name: 'autorId' })
  autor: Usuario;
}
