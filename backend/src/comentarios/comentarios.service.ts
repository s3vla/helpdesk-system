import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comentario } from './entities/comentario.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CriarComentarioDto } from './dto/criar-comentario.dto';
import { EditarComentarioDto } from './dto/editar-comentario.dto';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { TipoComentario } from '../common/enums/tipo-comentario.enum';
import { StatusChamado } from '../common/enums/status-chamado.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { LogAuditoriaService } from '../log-auditoria/log-auditoria.service';
import { AcaoAuditoria } from '../common/enums/acao-auditoria.enum';
import { EmailService } from '../email/email.service';

// Janela pra editar um comentário próprio, ver ComentariosService.editar.
const JANELA_EDICAO_MS = 15 * 60 * 1000;

@Injectable()
export class ComentariosService {
  private readonly logger = new Logger(ComentariosService.name);

  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
    // Precisa ler "chamado" pra saber quem é o solicitante antes de deixar
    // alguém comentar ou listar comentários — é essa checagem que fecha o
    // IDOR: sem ela, bastaria um colaborador saber o :id de um chamado
    // alheio pra ler ou escrever nele.
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
    private readonly logAuditoriaService: LogAuditoriaService,
    // Mesmo raciocínio de ChamadosService: o próprio EmailService garante
    // que uma falha de envio nunca propaga pra cá.
    private readonly emailService: EmailService,
  ) {}

  // Centraliza a busca do chamado + a checagem de dono, usada tanto ao
  // criar quanto ao listar comentários (ver chamadas abaixo). Lança 404 se o
  // chamado não existe e 403 se um colaborador está tentando acessar um
  // chamado que não é dele nem está observando — nunca deixa passar em
  // silêncio. "Dono de acesso legítimo" inclui solicitante E observadores
  // ("Cc") — mesma regra de ChamadosService.buscarDetalhado, checada aqui
  // contra `chamado.observadores` (carregado junto de propósito).
  private async carregarChamadoPermitido(
    chamadoId: number,
    usuarioAtual: JwtPayload,
  ): Promise<Chamado> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id: chamadoId },
      relations: { solicitante: true, observadores: { usuario: true } },
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

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
        'Você só pode acessar comentários de chamados que você mesmo abriu ou está observando',
      );
    }

    return chamado;
  }

  async criar(
    chamadoId: number,
    dto: CriarComentarioDto,
    usuarioAtual: JwtPayload,
  ): Promise<Comentario> {
    const chamado = await this.carregarChamadoPermitido(
      chamadoId,
      usuarioAtual,
    );

    // Chamado finalizado não aceita novos comentários — nem do solicitante,
    // nem de observador, nem de técnico. Precisa reabrir primeiro
    // (PATCH /chamados/:id/status com "PARADO"). O frontend já desabilita o
    // campo pra esse caso nem aparecer; isso aqui é o que garante a regra de
    // verdade, pra alguém não conseguir contornar chamando a API direto.
    if (chamado.status === StatusChamado.FINALIZADO) {
      throw new ForbiddenException(
        'Este chamado está finalizado — reabra para adicionar novos comentários',
      );
    }

    // Comentário só com imagem (sem texto nenhum) é válido — só bloqueia se
    // os dois estiverem vazios, senão daria pra mandar uma requisição
    // completamente em branco.
    if (!dto.texto?.trim() && !dto.imagensUrls?.length) {
      throw new BadRequestException(
        'O comentário precisa ter um texto ou uma imagem anexada',
      );
    }

    // Só técnico pode marcar um comentário como interno — se um colaborador
    // mandar `interno: true` no corpo, isso é silenciosamente ignorado aqui,
    // nunca gera erro (só não tem efeito).
    const podeSerInterno = usuarioAtual.tipo === TipoUsuario.TECNICO;
    const interno = podeSerInterno ? !!dto.interno : false;

    // Marca se quem está comentando é um observador ("Cc"), não o
    // solicitante original — o histórico usa isso pra não gerar confusão
    // sobre quem é o dono do chamado (ver ComentarioResponseDto).
    const ehObservador = chamado.observadores.some(
      (observador) => observador.usuario.id === usuarioAtual.sub,
    );

    const comentario = this.comentarioRepository.create({
      chamado: { id: chamadoId } as Chamado,
      autor: { id: usuarioAtual.sub } as Usuario,
      texto: dto.texto ?? '',
      interno,
      imagensUrls: dto.imagensUrls ?? [],
      ehObservador,
    });
    const salvo = await this.comentarioRepository.save(comentario);

    await this.logAuditoriaService.registrar({
      chamadoId,
      usuarioId: usuarioAtual.sub,
      acao: AcaoAuditoria.COMENTARIO,
      descricao: interno
        ? 'Comentário interno adicionado'
        : 'Comentário adicionado',
    });

    // "Aguardando resposta de" troca automaticamente pro lado OPOSTO de
    // quem acabou de comentar — mas só durante atendimento ativo, e só se o
    // comentário for visível pro colaborador (comentário interno nunca deve
    // mudar isso: colaborador nunca vê esse comentário, então não faz
    // sentido ele "estar aguardando resposta" de algo que não existe pra
    // ele). Observador ("Cc") comentando conta como lado COLABORADOR, igual
    // ao próprio solicitante.
    if (!interno && chamado.status === StatusChamado.ANDAMENTO) {
      chamado.aguardandoRespostaDe =
        usuarioAtual.tipo === TipoUsuario.TECNICO
          ? TipoUsuario.COLABORADOR
          : TipoUsuario.TECNICO;
      await this.chamadoRepository.save(chamado);
    }

    // Carregado ANTES do e-mail (não só no final, como antes) porque a
    // notificação precisa do NOME de quem comentou pra dizer "Fulano
    // respondeu..." — sem isso só teríamos `usuarioAtual.sub` (id cru, o
    // JWT não carrega nome). Mesmo valor que seria buscado no final de
    // qualquer forma, só adiantado.
    const comentarioCompleto = await this.comentarioRepository.findOneOrFail({
      where: { id: salvo.id },
      relations: { autor: true },
    });

    // Fire-and-forget — só para comentário VISÍVEL pro colaborador;
    // comentário interno é só entre técnicos, não gera e-mail pro
    // solicitante/observadores. `chamado` já veio com
    // solicitante/observadores.usuario carregados de
    // carregarChamadoPermitido, então não precisa de outra consulta aqui.
    // .catch: enviarComSeguranca só cobre falha do SMTP em si — se a
    // MONTAGEM do e-mail lançar antes disso, uma promise rejeitada sem
    // handler derruba o processo Node inteiro, não só essa notificação.
    if (!interno) {
      void this.emailService
        .enviarNotificacaoAtualizacaoChamado(
          chamado,
          usuarioAtual.sub,
          comentario.texto,
          comentarioCompleto.autor.nome ?? comentarioCompleto.autor.email,
        )
        .catch((erro: unknown) =>
          this.logger.error(
            'Falha ao notificar comentário no chamado por e-mail',
            erro,
          ),
        );
    }

    return comentarioCompleto;
  }

  async listarPorChamado(
    chamadoId: number,
    usuarioAtual: JwtPayload,
  ): Promise<Comentario[]> {
    await this.carregarChamadoPermitido(chamadoId, usuarioAtual);

    const podeVerInternos = usuarioAtual.tipo === TipoUsuario.TECNICO;

    return this.comentarioRepository.find({
      where: podeVerInternos
        ? { chamado: { id: chamadoId } }
        : { chamado: { id: chamadoId }, interno: false },
      relations: { autor: true },
      order: { dataCriacao: 'ASC' },
    });
  }

  // PATCH /comentarios/:id — diferente de criar/listarPorChamado, não passa
  // por carregarChamadoPermitido: a checagem de acesso aqui é mais estrita
  // (só o AUTOR, nunca outro solicitante/observador do mesmo chamado), então
  // não faz sentido reaproveitar aquela regra mais ampla.
  async editar(
    comentarioId: number,
    dto: EditarComentarioDto,
    usuarioAtual: JwtPayload,
  ): Promise<Comentario> {
    const comentario = await this.comentarioRepository.findOne({
      where: { id: comentarioId },
      relations: { autor: true, chamado: true },
    });
    if (!comentario) throw new NotFoundException('Comentário não encontrado');

    if (comentario.autor.id !== usuarioAtual.sub) {
      throw new ForbiddenException('Só o autor pode editar este comentário');
    }
    // NIVEL_AJUSTADO é um registro automático de auditoria (ver
    // ChamadosService.reclassificarNivel), não algo "escrito por alguém" —
    // mesmo que o autor bata (o técnico que reclassificou), não é uma
    // conversa pra editar.
    if (comentario.tipo !== TipoComentario.COMENTARIO) {
      throw new ForbiddenException(
        'Este registro é gerado automaticamente e não pode ser editado',
      );
    }
    if (comentario.chamado.status === StatusChamado.FINALIZADO) {
      throw new ForbiddenException(
        'Chamado finalizado — não é possível editar comentários',
      );
    }
    const decorridoMs = Date.now() - comentario.dataCriacao.getTime();
    if (decorridoMs > JANELA_EDICAO_MS) {
      throw new ForbiddenException(
        'Prazo de 15 minutos para editar este comentário já passou',
      );
    }

    comentario.texto = dto.texto.trim();
    comentario.editadoEm = new Date();
    const salvo = await this.comentarioRepository.save(comentario);

    await this.logAuditoriaService.registrar({
      chamadoId: comentario.chamado.id,
      usuarioId: usuarioAtual.sub,
      acao: AcaoAuditoria.EDICAO,
      descricao: 'Comentário editado',
    });

    return this.comentarioRepository.findOneOrFail({
      where: { id: salvo.id },
      relations: { autor: true },
    });
  }
}
