import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PalavraChaveN3 } from './entities/palavra-chave-n3.entity';
import { CriarPalavraChaveN3Dto } from './dto/criar-palavra-chave-n3.dto';
import { AtualizarPalavraChaveN3Dto } from './dto/atualizar-palavra-chave-n3.dto';

@Injectable()
export class PalavrasChaveN3Service {
  constructor(
    @InjectRepository(PalavraChaveN3)
    private readonly palavraChaveRepository: Repository<PalavraChaveN3>,
  ) {}

  // Admin (Administração → Palavras-chave N3): lista todas, incluindo
  // inativas — é a tela onde o técnico reativa/desativa.
  async listarTodas(): Promise<PalavraChaveN3[]> {
    return this.palavraChaveRepository.find({ order: { palavra: 'ASC' } });
  }

  // Usado por ChamadosService pra montar a lista de termos que sobrepõem o
  // nivelPadrao da categoria na triagem automática (ver nivel-triagem.util.ts).
  async listarAtivas(): Promise<PalavraChaveN3[]> {
    return this.palavraChaveRepository.find({
      where: { ativo: true },
      order: { palavra: 'ASC' },
    });
  }

  async criar(dto: CriarPalavraChaveN3Dto): Promise<PalavraChaveN3> {
    const palavraChave = this.palavraChaveRepository.create({
      palavra: dto.palavra.trim(),
    });
    return this.palavraChaveRepository.save(palavraChave);
  }

  async atualizar(
    id: number,
    dto: AtualizarPalavraChaveN3Dto,
  ): Promise<PalavraChaveN3> {
    const palavraChave = await this.palavraChaveRepository.findOne({
      where: { id },
    });
    if (!palavraChave) {
      throw new NotFoundException('Palavra-chave não encontrada');
    }
    if (dto.ativo !== undefined) palavraChave.ativo = dto.ativo;
    return this.palavraChaveRepository.save(palavraChave);
  }

  // Exclusão física direta — nada referencia PalavraChaveN3 por FK (é só
  // consultada em memória durante a triagem, nunca vinculada a um chamado
  // específico), então não precisa da checagem de uso que Categoria tem.
  async remover(id: number): Promise<void> {
    const palavraChave = await this.palavraChaveRepository.findOne({
      where: { id },
    });
    if (!palavraChave) {
      throw new NotFoundException('Palavra-chave não encontrada');
    }
    await this.palavraChaveRepository.delete(id);
  }
}
