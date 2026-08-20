import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolucaoConhecida } from './entities/solucao-conhecida.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { CategoriaChamado } from '../common/enums/categoria-chamado.enum';
import { FiltrosSolucaoDto } from './dto/filtros-solucao.dto';
import {
  mapSolucaoParaResposta,
  SolucaoConhecidaResponseDto,
} from './dto/solucao-conhecida-response.dto';
import { SolucaoSugeridaResponseDto } from './dto/solucao-sugerida-response.dto';
import {
  contarPalavrasEmComum,
  extrairPalavrasChave,
} from './palavras-chave.util';

// No máximo 3 sugestões no painel do técnico — o suficiente pra dar uma
// pista sem virar uma lista longa que ninguém lê.
const MAXIMO_SUGESTOES = 3;

interface CriarSolucaoParams {
  chamadoId: number;
  comoFoiResolvido: string;
  marcadaComo: boolean;
  categoria: CategoriaChamado;
  imagemUrl: string | null;
}

@Injectable()
export class SolucoesConhecidasService {
  constructor(
    @InjectRepository(SolucaoConhecida)
    private readonly solucaoRepository: Repository<SolucaoConhecida>,
    // Este módulo também lê (nunca escreve) a tabela "chamado" — precisa
    // dela tanto para trazer título/descrição/técnico na resposta quanto
    // para calcular quantas vezes cada categoria já apareceu no total de
    // chamados (ver contarOcorrenciasPorCategoria). Registrar o repositório
    // de outra entity dentro deste módulo é um atalho aceitável quando o uso
    // é só leitura e evita um import circular com ChamadosModule (que
    // depende deste módulo para gravar a solução ao finalizar).
    @InjectRepository(Chamado)
    private readonly chamadoRepository: Repository<Chamado>,
  ) {}

  // `chamado.solucaoConhecida` é @OneToOne — só pode existir UM registro de
  // solução por chamado (constraint unique na coluna chamadoId). Regra de
  // negócio combinada: reabrir e finalizar de novo NÃO edita a solução já
  // registrada (opção "b" — preserva o histórico da primeira resolução).
  // Por isso ChamadosService.atualizarStatus já checa existeParaChamado()
  // ANTES de chamar criar() e simplesmente pula essa chamada quando já
  // existe uma solução — este guard aqui é só um backstop defensivo, pra
  // nunca mais estourar o erro cru de constraint (500 sem explicação) se
  // esse método for chamado de outro lugar sem passar por aquela checagem.
  async existeParaChamado(chamadoId: number): Promise<boolean> {
    const existente = await this.solucaoRepository.findOne({
      where: { chamado: { id: chamadoId } },
    });
    return !!existente;
  }

  async criar(dados: CriarSolucaoParams): Promise<SolucaoConhecida> {
    if (await this.existeParaChamado(dados.chamadoId)) {
      throw new ConflictException(
        'Este chamado já tem uma solução registrada de uma finalização anterior.',
      );
    }

    const solucao = this.solucaoRepository.create({
      chamado: { id: dados.chamadoId } as Chamado,
      comoFoiResolvido: dados.comoFoiResolvido,
      marcadaComo: dados.marcadaComo,
      categoria: dados.categoria,
      imagemUrl: dados.imagemUrl,
    });
    return this.solucaoRepository.save(solucao);
  }

  private async contarOcorrenciasPorCategoria(): Promise<
    Record<string, number>
  > {
    const linhas = await this.chamadoRepository
      .createQueryBuilder('chamado')
      .select('chamado.categoria', 'categoria')
      .addSelect('COUNT(*)', 'total')
      .groupBy('chamado.categoria')
      .getRawMany<{ categoria: string; total: string }>();

    // `total` sai como string do driver do SQLite — convertendo pra number
    // aqui, uma vez só, em vez de espalhar `Number(...)` na resposta.
    return Object.fromEntries(
      linhas.map((linha) => [linha.categoria, Number(linha.total)]),
    );
  }

  async listar(
    filtros: FiltrosSolucaoDto,
  ): Promise<SolucaoConhecidaResponseDto[]> {
    const query = this.solucaoRepository
      .createQueryBuilder('solucao')
      .innerJoinAndSelect('solucao.chamado', 'chamado')
      .leftJoinAndSelect('chamado.tecnicoResponsavel', 'tecnicoResponsavel')
      // Só entram soluções que o técnico realmente marcou como
      // "reaproveitável" — é essa flag que distingue "chamado finalizado
      // qualquer" de "solução conhecida" (ver regra em ChamadosService).
      .where('solucao.marcadaComo = :marcada', { marcada: true });

    if (filtros.categoria) {
      query.andWhere('solucao.categoria = :categoria', {
        categoria: filtros.categoria,
      });
    }

    if (filtros.busca?.trim()) {
      const termo = `%${filtros.busca.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(chamado.titulo) LIKE :termo OR LOWER(solucao.comoFoiResolvido) LIKE :termo OR LOWER(solucao.categoria) LIKE :termo)',
        { termo },
      );
    }

    query.orderBy('solucao.dataCriacao', 'DESC');

    const [solucoes, ocorrencias] = await Promise.all([
      query.getMany(),
      this.contarOcorrenciasPorCategoria(),
    ]);

    return solucoes.map((solucao) =>
      mapSolucaoParaResposta(solucao, ocorrencias[solucao.categoria] ?? 0),
    );
  }

  // GET /chamados/:id/solucoes-sugeridas — busca soluções conhecidas da
  // MESMA categoria do chamado e ordena pela quantidade de palavras em
  // comum entre as descrições (ver palavras-chave.util.ts). Sem
  // IA/embeddings de propósito: é só correspondência de termos, simples o
  // bastante pra explicar numa frase.
  async sugerirParaChamado(
    chamado: Chamado,
  ): Promise<SolucaoSugeridaResponseDto[]> {
    const candidatas = await this.solucaoRepository.find({
      where: { marcadaComo: true, categoria: chamado.categoria },
      relations: { chamado: true },
    });

    const palavrasDoChamadoAtual = extrairPalavrasChave(chamado.descricao);

    const pontuadas = candidatas
      // Nunca sugere o próprio chamado como "parecido com ele mesmo" — só
      // é relevante se já tiver sido finalizado com solução ANTES, o que
      // só aconteceria se alguém reabrisse um chamado já resolvido.
      .filter((solucao) => solucao.chamado.id !== chamado.id)
      .map((solucao) => ({
        solucao,
        pontuacao: contarPalavrasEmComum(
          palavrasDoChamadoAtual,
          extrairPalavrasChave(solucao.chamado.descricao),
        ),
      }))
      // Precisa ter PELO MENOS uma palavra em comum — "mesma categoria" não
      // basta sozinho, senão qualquer chamado de Hardware sugeriria
      // qualquer outro chamado de Hardware sem relação nenhuma de assunto.
      .filter((item) => item.pontuacao > 0)
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, MAXIMO_SUGESTOES);

    if (pontuadas.length === 0) return [];

    const ocorrencias = await this.contarOcorrenciasPorCategoria();

    return pontuadas.map(({ solucao }) => ({
      chamadoId: solucao.chamado.id,
      resumo: solucao.chamado.titulo,
      comoFoiResolvido: solucao.comoFoiResolvido,
      ocorrenciasCategoria: ocorrencias[solucao.categoria] ?? 0,
    }));
  }
}
