import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { PrioridadeChamado } from '../../common/enums/prioridade-chamado.enum';
import { NivelChamado } from '../../common/enums/nivel-chamado.enum';
import { StatusChamado } from '../../common/enums/status-chamado.enum';
import { TipoUsuario } from '../../common/enums/tipo-usuario.enum';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Comentario } from '../../comentarios/entities/comentario.entity';
import { SolucaoConhecida } from '../../solucoes-conhecidas/entities/solucao-conhecida.entity';
import { ChamadoObservador } from '../../observadores/entities/chamado-observador.entity';

@Entity()
export class Chamado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  // `nullable: true` porque o campo é opcional no formulário de abertura —
  // sem essa flag o TypeORM cria a coluna como NOT NULL por padrão.
  @Column({ type: 'text', nullable: true })
  mensagemErro: string | null;

  // Era um enum fixo (CategoriaChamado); agora é uma FK pra uma tabela que
  // o técnico administra em Administração → Categorias (ver Categoria
  // entity). `eager: true` — SEMPRE vem junto em qualquer find()/findOne()
  // deste repositório, sem precisar listar `categoria: true` em `relations`
  // em cada consulta espalhada por chamados.service.ts (muitos pontos
  // dependiam de `chamado.categoria` já vir preenchido quando isso era só
  // uma coluna simples). `nullable: false`: todo chamado sempre teve
  // categoria, sem exceção.
  @ManyToOne(() => Categoria, { eager: true, nullable: false })
  @JoinColumn({ name: 'categoriaId' })
  categoria: Categoria;

  @Column({ type: 'enum', enum: PrioridadeChamado })
  prioridade: PrioridadeChamado;

  // Definido pela regra de negócio no momento da criação (ChamadosService),
  // nunca escolhido pelo cliente da API — por isso não existe no DTO de
  // entrada, só na resposta.
  @Column({ type: 'enum', enum: NivelChamado })
  nivel: NivelChamado;

  @Column({ type: 'enum', enum: StatusChamado, default: StatusChamado.PARADO })
  status: StatusChamado;

  // Só tem significado enquanto status === ANDAMENTO — reavaliado (zerado
  // ou recalculado) a cada troca de status em ChamadosService.atualizarStatus
  // e a cada comentário não-interno em ComentariosService.criar. Reaproveita
  // TipoUsuario em vez de um enum próprio porque os valores são exatamente
  // os mesmos (TECNICO | COLABORADOR) — não faria sentido duplicar.
  @Column({ type: 'enum', enum: TipoUsuario, nullable: true })
  aguardandoRespostaDe: TipoUsuario | null;

  // Lista das URLs relativas devolvidas por POST /uploads (ex:
  // "/uploads/uuid.png"), uma por arquivo anexado ao abrir o chamado — os
  // arquivos em si ficam salvos em disco (ver UploadsController) e
  // servidos estaticamente, aqui só guardamos os caminhos. `simple-json`
  // serializa o array como texto na coluna sozinho — não precisa de uma
  // tabela própria só pra isso (não há necessidade de consultar/filtrar
  // por imagem individual em lugar nenhum do sistema). Sempre um array
  // (nunca null) — vazio quando nenhum arquivo foi anexado.
  @Column({ type: 'simple-json', default: '[]' })
  imagensUrls: string[];

  // Preenchido pelo próprio colaborador ao abrir o chamado, opcional, sem
  // validação de formato rígida (o ID do AnyDesk pode ter espaços/traços
  // dependendo de como a pessoa copiou da tela do programa). Visível pra
  // colaborador e técnico igual — só a AÇÃO de conectar é exclusiva do
  // técnico, isso é decidido no frontend, não aqui.
  @Column({ type: 'text', nullable: true })
  anydeskId: string | null;

  // @CreateDateColumn / @UpdateDateColumn são preenchidas automaticamente
  // pelo TypeORM (na primeira inserção e a cada UPDATE, respectivamente) —
  // não precisamos setar essas datas manualmente em nenhum service.
  @CreateDateColumn()
  dataAbertura: Date;

  @UpdateDateColumn()
  dataAtualizacao: Date;

  // @ManyToOne = "muitos Chamados para um Usuario". @JoinColumn diz qual
  // lado da relação guarda a chave estrangeira de fato (aqui, a tabela
  // "chamado" ganha uma coluna solicitanteId). `nullable: false` (o padrão,
  // mas deixado explícito) garante no banco que todo chamado tem solicitante
  // — reforça a regra "nunca fica nulo" já na estrutura da tabela.
  @ManyToOne(() => Usuario, (usuario) => usuario.chamadosAbertos, {
    nullable: false,
  })
  @JoinColumn({ name: 'solicitanteId' })
  solicitante: Usuario;

  // Aqui sim é opcional: só é preenchido quando um técnico inicia o
  // atendimento (ChamadosService.atualizarStatus).
  @ManyToOne(() => Usuario, (usuario) => usuario.chamadosAtendidos, {
    nullable: true,
  })
  @JoinColumn({ name: 'tecnicoResponsavelId' })
  tecnicoResponsavel: Usuario | null;

  // Campo de AUDITORIA, não de posse: quando um técnico abre um chamado em
  // nome de um colaborador (POST /chamados/tecnico, cenário "colega ligou
  // pedindo"), `solicitante` acima continua sendo o colaborador de verdade
  // (dono real, aparece em Meus Chamados dele normalmente) — este campo só
  // registra QUEM criou o registro. Sempre nulo quando o próprio
  // colaborador abre pelo fluxo normal (POST /chamados). Sem inverse side
  // em Usuario de propósito: nada mais no sistema precisa navegar "chamados
  // que este técnico abriu em nome de alguém" a partir do Usuario.
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'abertoPorTecnicoId' })
  abertoPorTecnico: Usuario | null;

  @OneToMany(() => Comentario, (comentario) => comentario.chamado)
  comentarios: Comentario[];

  @OneToOne(() => SolucaoConhecida, (solucao) => solucao.chamado)
  solucaoConhecida: SolucaoConhecida | null;

  // "Cc" do chamado — colaboradores que não são o solicitante, mas têm
  // acesso de leitura/comentário (ver ObservadoresService). Carregado junto
  // nas consultas padrão de Chamado (RELACOES_PADRAO, em ChamadosService)
  // porque ChamadoResponseDto sempre expõe essa lista, e a checagem de IDOR
  // (buscarDetalhado / ComentariosService.carregarChamadoPermitido) também
  // depende dela já vir carregada.
  @OneToMany(() => ChamadoObservador, (observador) => observador.chamado)
  observadores: ChamadoObservador[];
}
