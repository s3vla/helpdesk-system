import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { TipoComentario } from '../common/enums/tipo-comentario.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Like, Repository } from 'typeorm';
import { Chamado } from './entities/chamado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Comentario } from '../comentarios/entities/comentario.entity';
import { CriarChamadoDto } from './dto/criar-chamado.dto';
import { AbrirChamadoTecnicoDto } from './dto/abrir-chamado-tecnico.dto';
import { AtualizarStatusChamadoDto } from './dto/atualizar-status-chamado.dto';
import { AtualizarNivelChamadoDto } from './dto/atualizar-nivel-chamado.dto';
import { FiltrosChamadoDto } from './dto/filtros-chamado.dto';
import { StatusChamado } from '../common/enums/status-chamado.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { SolucoesConhecidasService } from '../solucoes-conhecidas/solucoes-conhecidas.service';
import { ObservadoresService } from '../observadores/observadores.service';
import { calcularNivelSugerido } from './nivel-triagem.util';

// Relações que toda consulta de Chamado precisa trazer junto — sem isso o
// TypeORM devolveria só os ids (solicitanteId/tecnicoResponsavelId) e o
// mapeamento pra ChamadoResponseDto (que expõe nome/cargo etc.) quebraria.
// `observadores.usuario` também entra aqui: além de aparecer na resposta
// (lista de "Cc"), buscarDetalhado usa essa relação já carregada pra
// decidir se um colaborador que não é o solicitante ainda assim tem acesso
// por ser observador.
const RELACOES_PADRAO = {
  solicitante: true,
  tecnicoResponsavel: true,
  abertoPorTecnico: true,
  solucaoConhecida: true,
  observadores: { usuario: true },
};

// Usado só dentro de atualizarStatus, para CARREGAR o chamado que vamos
// mutar e salvar em seguida. Não inclui `solucaoConhecida` de propósito: se
// carregássemos essa relação aqui, o TypeORM guardaria "solucaoConhecida:
// null" no objeto (chamado ainda não tinha solução no momento da leitura) e,
// ao chamar save() logo depois de já termos inserido a nova SolucaoConhecida
// em paralelo, ele tentaria "desassociar" essa relação (UPDATE ... SET
// chamadoId = NULL), violando a constraint NOT NULL. Ler sem essa relação
// aqui evita o problema; a resposta final ainda vem completa porque
// buscarPorIdOuFalhar (com RELACOES_PADRAO) é chamado de novo no final,
// como uma leitura fresca, sem essa armadilha de save().
const RELACOES_PARA_ATUALIZAR = { solicitante: true, tecnicoResponsavel: true };

// O "número do chamado" exibido no front (#1000+id, ver
// frontend/src/utils/numeroChamado.js) nunca é gravado no banco — é sempre
// derivado do id na hora de mostrar OU, aqui, na hora de buscar de volta.
// Só tenta interpretar `busca` como número quando ela é puramente dígitos
// (com ou sem "#" na frente); qualquer outra coisa (texto, "#12a" etc.)
// devolve null e a busca segue só pelo caminho de texto livre.
function extrairIdDoNumeroChamado(busca: string): number | null {
  const semHash = busca.trim().replace(/^#/, '');
  if (!/^\d+$/.test(semHash)) return null;
  const id = parseInt(semHash, 10) - 1000;
  return id > 0 ? id : null;
}

@Injectable()
export class ChamadosService {
  constructor(
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
    // Só pra gravar o comentário automático de auditoria em
    // reclassificarNivel (ver ali) — não passa pelo ComentariosService de
    // propósito, ver comentário em ChamadosModule.
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
    // ChamadosModule importa SolucoesConhecidasModule (que exporta esse
    // service) só para este único uso: ao finalizar um chamado, precisamos
    // criar o registro de solução — a regra "toda finalização gera uma
    // SolucaoConhecida" fica aqui, mas SALVAR essa entidade é
    // responsabilidade do módulo dela, não deste.
    private readonly solucoesConhecidasService: SolucoesConhecidasService,
    // Usado só em listarObservados (GET /chamados/observando) — o resto do
    // acesso a ChamadoObservador (checagem de IDOR) acontece sem essa
    // injeção, direto via a relação `observadores` já carregada por
    // RELACOES_PADRAO, ver buscarDetalhado.
    private readonly observadoresService: ObservadoresService,
    // Só leitura — usado em criarComoTecnico pra validar que o
    // solicitanteId informado é mesmo um colaborador com conta ativa antes
    // de abrir o chamado em nome dele. Injetado direto (em vez de importar
    // UsuariosModule) porque UsuariosModule já importa ChamadosModule (pra
    // GET /usuarios/:id/chamados) — importar de volta criaria um ciclo.
    // Mesma solução que ObservadoresService já usa pra essa mesma checagem.
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async criar(
    dto: CriarChamadoDto,
    solicitanteId: number,
    abertoPorTecnicoId: number | null = null,
  ): Promise<Chamado> {
    const chamado = this.chamadoRepository.create({
      titulo: dto.titulo,
      descricao: dto.descricao,
      mensagemErro: dto.mensagemErro ?? null,
      categoria: dto.categoria,
      prioridade: dto.prioridade,
      imagemUrl: dto.imagemUrl ?? null,
      anydeskId: dto.anydeskId ?? null,
      nivel: calcularNivelSugerido(
        dto.categoria,
        dto.descricao,
        dto.mensagemErro ?? null,
      ),
      status: StatusChamado.PARADO,
      // Atribuir só `{ id }` (em vez de buscar o Usuario inteiro) é um atalho
      // válido do TypeORM: ele entende que é uma referência de relação e
      // grava só o id na coluna solicitanteId, sem precisar de um SELECT
      // extra aqui — o `id` vem do token (JwtPayload.sub) no fluxo normal,
      // ou de `solicitanteId` já validado em criarComoTecnico no fluxo do
      // técnico — nunca de um campo cru e não-validado do body.
      solicitante: { id: solicitanteId } as Usuario,
      abertoPorTecnico: abertoPorTecnicoId ? { id: abertoPorTecnicoId } : null,
    });
    const salvo = await this.chamadoRepository.save(chamado);
    return this.buscarPorIdOuFalhar(salvo.id);
  }

  // POST /chamados/tecnico — técnico abre um chamado em nome de um
  // colaborador (cenário "colega ligou/pediu pessoalmente"). Reaproveita
  // `criar()` inteiro (mesmo cálculo de nível, mesmo status inicial) só
  // trocando QUEM é o solicitante e registrando QUEM criou de fato.
  async criarComoTecnico(
    dto: AbrirChamadoTecnicoDto,
    tecnicoId: number,
  ): Promise<Chamado> {
    const solicitante = await this.usuarioRepository.findOne({
      where: { id: dto.solicitanteId },
    });
    // `senhaHash === null` é conta resetada (aguardando novo Primeiro
    // Acesso) — mesma checagem que ObservadoresService.adicionar já faz
    // pra "colaborador ativo", aplicada aqui pelo mesmo motivo: não faz
    // sentido abrir um chamado em nome de um e-mail de cargo que está sem
    // dono no momento.
    if (
      !solicitante ||
      solicitante.tipo !== TipoUsuario.COLABORADOR ||
      solicitante.senhaHash === null
    ) {
      throw new BadRequestException(
        'Só é possível abrir um chamado em nome de um colaborador com conta ativa',
      );
    }

    return this.criar(dto, dto.solicitanteId, tecnicoId);
  }

  async listarTodos(filtros: FiltrosChamadoDto): Promise<Chamado[]> {
    // Monta o `where` só com os filtros que realmente vieram — diferente de
    // versões antigas do TypeORM, esta aqui não ignora mais chaves com
    // valor `undefined` sozinha (lança erro em vez disso), então não dá
    // pra simplesmente passar `{ status: filtros.status, ... }` quando um
    // filtro não foi enviado na query string.
    const base: FindOptionsWhere<Chamado> = {};
    if (filtros.status) base.status = filtros.status;
    if (filtros.nivel) base.nivel = filtros.nivel;
    if (filtros.categoria) base.categoria = filtros.categoria;

    const busca = filtros.busca?.trim();
    let where: FindOptionsWhere<Chamado> | FindOptionsWhere<Chamado>[] = base;

    if (busca) {
      // Array de `where` = OR entre os elementos (cada um já herda os
      // filtros de `base` via spread, então status/nível/categoria continuam
      // valendo como AND de cada ramo do OR) — é assim que o TypeORM expressa
      // "(status = X) AND (titulo LIKE ... OR descricao LIKE ... OR id = ...)"
      // sem precisar de QueryBuilder pra este caso simples.
      where = [
        { ...base, titulo: Like(`%${busca}%`) },
        { ...base, descricao: Like(`%${busca}%`) },
      ];
      const idDoNumero = extrairIdDoNumeroChamado(busca);
      if (idDoNumero !== null) where.push({ ...base, id: idDoNumero });
    }

    return this.chamadoRepository.find({
      where,
      relations: RELACOES_PADRAO,
      order: { dataAbertura: 'DESC' },
    });
  }

  async listarPorUsuario(usuarioId: number): Promise<Chamado[]> {
    return this.chamadoRepository.find({
      where: { solicitante: { id: usuarioId } },
      relations: RELACOES_PADRAO,
      order: { dataAbertura: 'DESC' },
    });
  }

  // GET /chamados/observando — chamados onde o usuário é observador
  // ("Cc"), NUNCA misturado com /chamados/meus (solicitante): são duas
  // listas conceitualmente diferentes, mesmo que o mesmo usuário apareça
  // em ambas pra chamados diferentes.
  async listarObservados(usuarioId: number): Promise<Chamado[]> {
    const ids =
      await this.observadoresService.listarChamadoIdsObservados(usuarioId);
    if (ids.length === 0) return [];

    return this.chamadoRepository.find({
      where: { id: In(ids) },
      relations: RELACOES_PADRAO,
      order: { dataAbertura: 'DESC' },
    });
  }

  async buscarPorIdOuFalhar(id: number): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id },
      relations: RELACOES_PADRAO,
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');
    return chamado;
  }

  // Usado pela rota pública GET /chamados/:id — mesma checagem de dono que
  // ComentariosService faz para os comentários, aplicada aqui ao chamado em
  // si: sem isso, um colaborador autenticado poderia ler qualquer chamado só
  // sabendo o id (IDOR), mesmo sendo de outro colaborador. "Dono de acesso
  // legítimo" inclui o solicitante E qualquer observador ("Cc") do chamado
  // — checado em memória contra `chamado.observadores`, já carregado por
  // RELACOES_PADRAO, sem precisar de uma query extra aqui.
  async buscarDetalhado(
    id: number,
    usuarioAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.buscarPorIdOuFalhar(id);
    const ehSolicitante = chamado.solicitante.id === usuarioAtual.sub;
    const ehObservador = chamado.observadores.some(
      (observador) => observador.usuario.id === usuarioAtual.sub,
    );
    const ehColaboradorSemAcesso =
      usuarioAtual.tipo === TipoUsuario.COLABORADOR &&
      !ehSolicitante &&
      !ehObservador;
    if (ehColaboradorSemAcesso) {
      throw new ForbiddenException(
        'Você só pode acessar chamados que você mesmo abriu ou está observando',
      );
    }
    return chamado;
  }

  async atualizarStatus(
    id: number,
    dto: AtualizarStatusChamadoDto,
    tecnicoAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id },
      relations: RELACOES_PARA_ATUALIZAR,
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    // Regra: só entra em ANDAMENTO se ninguém mais estiver atendendo, ou se
    // quem está pedindo for o próprio técnico já responsável — impede que um
    // segundo técnico "roube" um chamado que já está sendo atendido.
    if (dto.status === StatusChamado.ANDAMENTO) {
      const jaTemResponsavel = !!chamado.tecnicoResponsavel;
      const responsavelEhOutroTecnico =
        jaTemResponsavel && chamado.tecnicoResponsavel!.id !== tecnicoAtual.sub;
      if (responsavelEhOutroTecnico) {
        throw new ForbiddenException(
          'Este chamado já está sendo atendido por outro técnico',
        );
      }
      if (!jaTemResponsavel) {
        chamado.tecnicoResponsavel = { id: tecnicoAtual.sub } as Usuario;
      }
    }

    if (dto.status === StatusChamado.FINALIZADO) {
      // Se o técnico pulou direto de PARADO para FINALIZADO sem passar por
      // ANDAMENTO, ainda assim precisamos registrar quem resolveu.
      if (!chamado.tecnicoResponsavel) {
        chamado.tecnicoResponsavel = { id: tecnicoAtual.sub } as Usuario;
      }

      // Regra de negócio (decidida explicitamente, não é comportamento
      // acidental): reabrir um chamado já finalizado e finalizar de novo
      // NÃO pede nem grava uma solução nova — a primeira "como foi
      // resolvido" fica intacta pra sempre. Isso combina com o desenho do
      // banco (SolucaoConhecida é @OneToOne com Chamado) e preserva o
      // histórico da resolução original, em vez de sobrescrevê-la em
      // silêncio. Se um dia for preciso CORRIGIR uma solução registrada
      // errada, isso deveria virar uma tela própria de edição — não
      // reaproveitar o fluxo de finalizar.
      const jaTemSolucao =
        await this.solucoesConhecidasService.existeParaChamado(chamado.id);
      if (!jaTemSolucao) {
        if (!dto.comoFoiResolvido?.trim()) {
          throw new BadRequestException(
            'Descreva como o chamado foi resolvido para finalizar',
          );
        }
        await this.solucoesConhecidasService.criar({
          chamadoId: chamado.id,
          comoFoiResolvido: dto.comoFoiResolvido,
          marcadaComo: dto.marcadaComo ?? false,
          categoria: chamado.categoria,
          imagemUrl: dto.imagemUrlSolucao ?? null,
        });
      }
    }

    // "Aguardando resposta de": só faz sentido durante atendimento ativo.
    // Precisa ser calculado ANTES de sobrescrever chamado.status abaixo,
    // porque a regra depende do status ANTERIOR (distinguir um verdadeiro
    // "Iniciar Atendimento", vindo de PARADO, de uma chamada idempotente com
    // o chamado já em ANDAMENTO). Iniciar atendimento começa com TECNICO: o
    // colaborador só descreveu o problema ao abrir o chamado, então cabe ao
    // técnico investigar/responder primeiro.
    if (dto.status === StatusChamado.ANDAMENTO) {
      if (chamado.status === StatusChamado.PARADO) {
        chamado.aguardandoRespostaDe = TipoUsuario.TECNICO;
      }
    } else {
      chamado.aguardandoRespostaDe = null;
    }

    chamado.status = dto.status;
    await this.chamadoRepository.save(chamado);
    return this.buscarPorIdOuFalhar(id);
  }

  // PATCH /chamados/:id/nivel — reclassificação manual. O nível é só uma
  // etiqueta de organização/filtro (ver nivel-triagem.util.ts), NUNCA
  // controle de acesso: qualquer um dos dois técnicos já podia ver e assumir
  // este chamado antes de chamar isso, e continua podendo depois, seja
  // qual for o nível novo. Registra um comentário automático com o "de/para"
  // — é esse comentário que guarda o histórico de quando a sugestão
  // automática precisou de ajuste manual. `tipo: NIVEL_AJUSTADO` (em vez do
  // padrão COMENTARIO) é o que deixa o frontend mostrar isso como um
  // pequeno log de auditoria separado da conversa, em vez de misturado nela.
  async reclassificarNivel(
    id: number,
    dto: AtualizarNivelChamadoDto,
    tecnicoAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({ where: { id } });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    if (dto.nivel !== chamado.nivel) {
      const nivelAnterior = chamado.nivel;
      chamado.nivel = dto.nivel;
      await this.chamadoRepository.save(chamado);

      const comentario = this.comentarioRepository.create({
        chamado: { id } as Chamado,
        autor: { id: tecnicoAtual.sub } as Usuario,
        texto: `Nível ajustado de ${nivelAnterior} para ${dto.nivel}`,
        // Interno: é uma nota operacional pro time de TI acompanhar a
        // qualidade da regra automática, não algo relevante pro colaborador
        // que abriu o chamado.
        interno: true,
        tipo: TipoComentario.NIVEL_AJUSTADO,
      });
      await this.comentarioRepository.save(comentario);
    }

    return this.buscarPorIdOuFalhar(id);
  }
}
