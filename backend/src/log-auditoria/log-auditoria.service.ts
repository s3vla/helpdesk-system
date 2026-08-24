import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogAuditoria } from './entities/log-auditoria.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AcaoAuditoria } from '../common/enums/acao-auditoria.enum';

interface RegistrarParams {
  chamadoId: number;
  usuarioId: number;
  acao: AcaoAuditoria;
  descricao: string;
}

@Injectable()
export class LogAuditoriaService {
  constructor(
    @InjectRepository(LogAuditoria)
    private readonly logRepository: Repository<LogAuditoria>,
  ) {}

  // Chamado por ChamadosService e ComentariosService a cada ação que
  // altera dado (nunca em rota de leitura) — ver os pontos de chamada em
  // atualizarStatus, atribuir, reclassificarNivel e ComentariosService.criar.
  async registrar(params: RegistrarParams): Promise<void> {
    const log = this.logRepository.create({
      chamado: { id: params.chamadoId } as Chamado,
      usuario: { id: params.usuarioId } as Usuario,
      acao: params.acao,
      descricao: params.descricao,
    });
    await this.logRepository.save(log);
  }

  // GET /chamados/:id/logs — mais recente primeiro, como pedido.
  async listarPorChamado(chamadoId: number): Promise<LogAuditoria[]> {
    return this.logRepository.find({
      where: { chamado: { id: chamadoId } },
      relations: { usuario: true },
      order: { dataHora: 'DESC' },
    });
  }
}
