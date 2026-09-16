import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Aviso } from '../avisos/entities/aviso.entity';
import { CriarGrupoDto } from './dto/criar-grupo.dto';
import { AtualizarGrupoDto } from './dto/atualizar-grupo.dto';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    // Só leitura — usada por remover() pra bloquear exclusão de um grupo
    // ainda referenciado por algum Aviso (destinatarioTipo = GRUPO), mesmo
    // raciocínio de CategoriasService injetar Chamado/SolucaoConhecida.
    @InjectRepository(Aviso)
    private readonly avisoRepository: Repository<Aviso>,
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
    const nome = dto.nome.trim();
    await this.garantirNomeDisponivel(nome);
    const grupo = this.grupoRepository.create({ nome, membros: [] });
    return this.grupoRepository.save(grupo);
  }

  // PATCH /grupos/:id — só o nome (ver AtualizarGrupoDto). `find` +
  // `ConflictException` explícito em vez de deixar a constraint UNIQUE do
  // banco estourar como QueryFailedError cru — mesmo padrão já usado em
  // SetoresService.criarMapeamento pra um erro claro em vez de 500.
  async atualizarGrupo(id: number, dto: AtualizarGrupoDto): Promise<Grupo> {
    await this.buscarPorIdOuFalhar(id);
    const nome = dto.nome.trim();
    await this.garantirNomeDisponivel(nome, id);
    await this.grupoRepository.update(id, { nome });
    return this.buscarPorIdOuFalhar(id);
  }

  private async garantirNomeDisponivel(
    nome: string,
    idIgnorado?: number,
  ): Promise<void> {
    const existente = await this.grupoRepository.findOne({ where: { nome } });
    if (existente && existente.id !== idIgnorado) {
      throw new ConflictException(`Já existe um grupo chamado "${nome}"`);
    }
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

  // DELETE /grupos/:id — exclusão física só quando nenhum Aviso aponta
  // pra este grupo (destinatarioTipo = GRUPO), mesmo raciocínio de
  // CategoriasService.remover: apagar quebraria a referência do aviso
  // (Aviso.grupo é NOT NULL só quando destinatarioTipo = GRUPO, mas a FK
  // em si tem ON DELETE NO ACTION — o Postgres recusaria de qualquer
  // jeito; preferimos um 409 com mensagem clara a deixar a query
  // estourar). Vínculos em grupo_membros somem sozinhos — a FK dessa
  // tabela tem ON DELETE CASCADE (ver migration CriarGrupos), então um
  // `.delete(id)` simples já basta, sem limpeza manual.
  async remover(id: number): Promise<void> {
    await this.buscarPorIdOuFalhar(id);

    const totalAvisos = await this.avisoRepository.count({
      where: { grupo: { id } },
    });
    if (totalAvisos > 0) {
      throw new ConflictException(
        `Este grupo está vinculado a ${totalAvisos} aviso${totalAvisos !== 1 ? 's' : ''} do Mural e não pode ser excluído — remova os membros ou pare de usar o grupo em novos avisos em vez de excluir.`,
      );
    }

    await this.grupoRepository.delete(id);
  }
}
