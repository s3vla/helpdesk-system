import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CriarGrupoDto } from './dto/criar-grupo.dto';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async listarGrupos(): Promise<Grupo[]> {
    return this.grupoRepository.find({
      relations: { membros: { setor: true } },
      order: { nome: 'ASC' },
    });
  }

  async buscarPorIdOuFalhar(id: number): Promise<Grupo> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: { membros: { setor: true } },
    });
    if (!grupo) throw new NotFoundException('Grupo não encontrado');
    return grupo;
  }

  async criarGrupo(dto: CriarGrupoDto): Promise<Grupo> {
    const grupo = this.grupoRepository.create({
      nome: dto.nome.trim(),
      membros: [],
    });
    return this.grupoRepository.save(grupo);
  }

  async adicionarMembro(grupoId: number, usuarioId: number): Promise<Grupo> {
    const grupo = await this.buscarPorIdOuFalhar(grupoId);
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    if (grupo.membros.some((m) => m.id === usuarioId)) {
      throw new ConflictException('Este usuário já faz parte do grupo');
    }

    grupo.membros.push(usuario);
    await this.grupoRepository.save(grupo);
    return this.buscarPorIdOuFalhar(grupoId);
  }

  async removerMembro(grupoId: number, usuarioId: number): Promise<Grupo> {
    const grupo = await this.buscarPorIdOuFalhar(grupoId);
    grupo.membros = grupo.membros.filter((m) => m.id !== usuarioId);
    await this.grupoRepository.save(grupo);
    return this.buscarPorIdOuFalhar(grupoId);
  }
}
