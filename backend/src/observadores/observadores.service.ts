import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChamadoObservador } from './entities/chamado-observador.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { TipoUsuario } from '../common/enums/tipo-usuario.enum';
import { EmailService } from '../email/email.service';

@Injectable()
export class ObservadoresService {
  private readonly logger = new Logger(ObservadoresService.name);

  constructor(
    @InjectRepository(ChamadoObservador)
    private readonly observadorRepository: Repository<ChamadoObservador>,
    // Só leitura — precisa saber quem é o solicitante (pra barrar
    // adicioná-lo como observador do próprio chamado) e conferir que o
    // chamado existe antes de gravar nada.
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
    // Só leitura — precisa validar que o alvo é um COLABORADOR com conta
    // ativa (não resetada) antes de deixar um técnico adicioná-lo como Cc.
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly emailService: EmailService,
  ) {}

  async adicionar(chamadoId: number, usuarioId: number): Promise<void> {
    const chamado = await this.chamadoRepository.findOne({
      where: { id: chamadoId },
      relations: { solicitante: true },
    });
    if (!chamado) throw new NotFoundException('Chamado não encontrado');

    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });
    // `senhaHash === null` é conta resetada (ver Usuario.senhaHash) —
    // "colaborador ativo" no pedido significa especificamente isso: não faz
    // sentido dar acesso de Cc a um e-mail de cargo que está aguardando
    // alguém completar o Primeiro Acesso de novo.
    if (
      !usuario ||
      usuario.tipo !== TipoUsuario.COLABORADOR ||
      usuario.senhaHash === null
    ) {
      throw new BadRequestException(
        'Só é possível adicionar como observador um colaborador com conta ativa',
      );
    }

    if (usuario.id === chamado.solicitante.id) {
      throw new BadRequestException(
        'O solicitante já tem acesso ao próprio chamado — não faz sentido adicioná-lo como observador',
      );
    }

    const jaEhObservador = await this.observadorRepository.findOne({
      where: { chamado: { id: chamadoId }, usuario: { id: usuarioId } },
    });
    if (jaEhObservador) {
      throw new ConflictException(
        'Este colaborador já está observando este chamado',
      );
    }

    const observador = this.observadorRepository.create({
      chamado: { id: chamadoId } as Chamado,
      usuario: { id: usuarioId } as Usuario,
    });
    await this.observadorRepository.save(observador);

    // Fire-and-forget, mesmo padrão de ComentariosService.criar — uma
    // falha de SMTP aqui não pode derrubar a resposta HTTP de "observador
    // adicionado com sucesso" (a ação principal já foi concluída acima).
    // `chamado` já veio carregado com `solicitante` (ver findOne no topo
    // desta função), que é o que dadosChamado() precisa pro corpo do
    // e-mail.
    void this.emailService
      .enviarNotificacaoAdicionadoComoObservador(chamado, usuario)
      .catch((erro: unknown) =>
        this.logger.error(
          'Falha ao notificar novo observador por e-mail',
          erro,
        ),
      );
  }

  async remover(chamadoId: number, usuarioId: number): Promise<void> {
    const resultado = await this.observadorRepository.delete({
      chamado: { id: chamadoId },
      usuario: { id: usuarioId },
    });
    if (resultado.affected === 0) {
      throw new NotFoundException(
        'Este colaborador não está observando este chamado',
      );
    }
  }

  // Usado por GET /chamados/observando — devolve só os ids pra
  // ChamadosService montar a resposta completa (mesmas relações padrão que
  // toda listagem de Chamado usa), em vez de duplicar esse conhecimento
  // aqui.
  async listarChamadoIdsObservados(usuarioId: number): Promise<number[]> {
    const registros = await this.observadorRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: { chamado: true },
      order: { adicionadoEm: 'DESC' },
    });
    return registros.map((registro) => registro.chamado.id);
  }
}
