import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setor } from './entities/setor.entity';
import { MapeamentoSetorEmail } from './entities/mapeamento-setor-email.entity';
import { CriarSetorDto } from './dto/criar-setor.dto';
import { CriarMapeamentoSetorDto } from './dto/criar-mapeamento-setor.dto';
import { AtualizarMapeamentoSetorDto } from './dto/atualizar-mapeamento-setor.dto';

@Injectable()
export class SetoresService {
  constructor(
    @InjectRepository(Setor)
    private readonly setorRepository: Repository<Setor>,
    @InjectRepository(MapeamentoSetorEmail)
    private readonly mapeamentoRepository: Repository<MapeamentoSetorEmail>,
  ) {}

  async listarSetores(): Promise<Setor[]> {
    return this.setorRepository.find({ order: { nome: 'ASC' } });
  }

  async criarSetor(dto: CriarSetorDto): Promise<Setor> {
    const setor = this.setorRepository.create({ nome: dto.nome.trim() });
    return this.setorRepository.save(setor);
  }

  async listarMapeamentos(): Promise<MapeamentoSetorEmail[]> {
    return this.mapeamentoRepository.find({
      relations: { setor: true },
      order: { prefixoEmail: 'ASC' },
    });
  }

  // Sempre minúsculo — mesma normalização de buscarSetorPorEmail, pra um
  // mapeamento cadastrado como "RH" e um e-mail "rh@..." se encontrarem
  // de qualquer jeito.
  async criarMapeamento(
    dto: CriarMapeamentoSetorDto,
  ): Promise<MapeamentoSetorEmail> {
    const prefixo = dto.prefixoEmail.trim().toLowerCase();
    const existente = await this.mapeamentoRepository.findOne({
      where: { prefixoEmail: prefixo },
    });
    if (existente) {
      throw new ConflictException(
        `Já existe um mapeamento para o prefixo "${prefixo}"`,
      );
    }
    const setor = await this.buscarSetorPorIdOuFalhar(dto.setorId);
    const mapeamento = this.mapeamentoRepository.create({
      prefixoEmail: prefixo,
      setor,
    });
    return this.mapeamentoRepository.save(mapeamento);
  }

  async atualizarMapeamento(
    id: number,
    dto: AtualizarMapeamentoSetorDto,
  ): Promise<MapeamentoSetorEmail> {
    const mapeamento = await this.mapeamentoRepository.findOne({
      where: { id },
      relations: { setor: true },
    });
    if (!mapeamento) throw new NotFoundException('Mapeamento não encontrado');
    mapeamento.setor = await this.buscarSetorPorIdOuFalhar(dto.setorId);
    return this.mapeamentoRepository.save(mapeamento);
  }

  // Usado por AuthService.primeiroAcesso (deriva o setor no SERVIDOR a
  // partir do e-mail, nunca mais confiando num valor que o cliente
  // mandasse) e pelo endpoint público GET /setores/sugerir (preview em
  // tempo real na tela de Primeiro Acesso, antes de existir qualquer
  // sessão/token). `null` quando o prefixo não tem mapeamento cadastrado
  // — quem chama decide o que fazer nesse caso (AuthService grava o
  // usuário sem setor; o preview do frontend mostra "não identificado").
  async buscarSetorPorEmail(email: string): Promise<Setor | null> {
    const prefixo = email.trim().toLowerCase().split('@')[0];
    const mapeamento = await this.mapeamentoRepository.findOne({
      where: { prefixoEmail: prefixo },
      relations: { setor: true },
    });
    return mapeamento?.setor ?? null;
  }

  private async buscarSetorPorIdOuFalhar(id: number): Promise<Setor> {
    const setor = await this.setorRepository.findOne({ where: { id } });
    if (!setor) throw new NotFoundException('Setor não encontrado');
    return setor;
  }
}
