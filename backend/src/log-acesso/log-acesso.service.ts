import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogAcesso } from './entities/log-acesso.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class LogAcessoService {
  constructor(
    @InjectRepository(LogAcesso)
    private readonly logAcessoRepository: Repository<LogAcesso>,
  ) {}

  // Chamado por AuthService.login DEPOIS de validar a senha com sucesso —
  // sempre com .catch() de quem chama (fire-and-forget, ver comentário lá):
  // um login nunca pode falhar por causa deste registro.
  async registrar(usuarioId: number, ipOrigem: string | null): Promise<void> {
    const log = this.logAcessoRepository.create({
      usuario: { id: usuarioId } as Usuario,
      ipOrigem,
    });
    await this.logAcessoRepository.save(log);
  }

  // Último acesso de cada usuário da lista, em UMA query agrupada (não uma
  // por usuário) — mesmo padrão de ChamadosService.contarPorSolicitantes,
  // pra RelatoriosService não cair num N+1 ao montar o relatório de acesso
  // pra todos os colaboradores de uma vez.
  async buscarUltimosAcessos(usuarioIds: number[]): Promise<Map<number, Date>> {
    const mapa = new Map<number, Date>();
    if (usuarioIds.length === 0) return mapa;

    const linhas = await this.logAcessoRepository
      .createQueryBuilder('log')
      .select('log.usuarioId', 'usuarioId')
      .addSelect('MAX(log.dataHora)', 'ultimoAcesso')
      .where('log.usuarioId IN (:...ids)', { ids: usuarioIds })
      .groupBy('log.usuarioId')
      .getRawMany<{ usuarioId: number; ultimoAcesso: Date }>();

    for (const linha of linhas) {
      mapa.set(linha.usuarioId, linha.ultimoAcesso);
    }
    return mapa;
  }
}
