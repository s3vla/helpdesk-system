import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SolucaoConhecida } from './entities/solucao-conhecida.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { FiltrosSolucaoDto } from './dto/filtros-solucao.dto';
import {
  mapSolucaoParaResposta,
  SolucaoConhecidaResponseDto,
} from './dto/solucao-conhecida-response.dto';
import { SolucaoSugeridaResponseDto } from './dto/solucao-sugerida-response.dto';
import {
  calcularSimilaridade,
  extrairPalavrasChave,
  LIMIAR_SIMILARIDADE_MINIMA,
} from './palavras-chave.util';
import {
  calcularPaginacao,
  montarRespostaPaginada,
  RespostaPaginadaDto,
} from '../common/dto/resposta-paginada.dto';

// No máximo 3 sugestões no painel do técnico — o suficiente pra dar uma
// pista sem virar uma lista longa que ninguém lê.
const MAXIMO_SUGESTOES = 3;

interface CriarSolucaoParams {
  chamadoId: number;
  comoFoiResolvido: string;
  marcadaComo: boolean;
  categoria: Categoria;
  imagensUrls: string[];
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
      imagensUrls: dados.imagensUrls,
    });
    return this.solucaoRepository.save(solucao);
  }

  // Ao contrário de `criar` (chamada só na PRIMEIRA finalização), este
  // método atualiza uma solução que JÁ EXISTE — usado quando o técnico
  // reabre um chamado finalizado e aproveita pra marcar a solução
  // original como conhecida (ver ChamadosService.atualizarStatus,
  // transição PARADO com marcadaComo:true). Idempotente: chamar de novo
  // numa solução já marcada não faz nada. Sem lançar erro se não existir
  // solução — só deveria acontecer para um chamado que nunca foi
  // finalizado, e reabrir via UI só é possível a partir de FINALIZADO,
  // então isso é só um backstop defensivo, não um caminho esperado.
  async marcarComoConhecida(chamadoId: number): Promise<void> {
    const solucao = await this.solucaoRepository.findOne({
      where: { chamado: { id: chamadoId } },
    });
    if (!solucao || solucao.marcadaComo) return;
    solucao.marcadaComo = true;
    await this.solucaoRepository.save(solucao);
  }

  // Chave por ID da categoria (não mais o nome cru) — agora que categoria é
  // uma relação, agrupar direto pela FK (`chamado.categoriaId`) evita um
  // JOIN só pra contar, e o id é uma chave sem ambiguidade nenhuma (nome
  // pode em teoria repetir se alguém desativar e criar outra com o mesmo
  // nome depois — id nunca).
  private async contarOcorrenciasPorCategoria(): Promise<
    Record<number, number>
  > {
    const linhas = await this.chamadoRepository
      .createQueryBuilder('chamado')
      // Sem JOIN de propósito: referenciar a relação direto (sem
      // leftJoin antes) faz o TypeORM selecionar a coluna de FK crua
      // (categoriaId) em vez de tentar montar a entity relacionada
      // inteira — é o jeito idiomático de pegar só o id de uma relação
      // to-one sem pagar o custo de um JOIN.
      .select('chamado.categoria', 'categoriaId')
      .addSelect('COUNT(*)', 'total')
      .groupBy('chamado.categoria')
      .getRawMany<{ categoriaId: number; total: string }>();

    // `total` sai como string do driver do Postgres — convertendo pra
    // number aqui, uma vez só, em vez de espalhar `Number(...)` na resposta.
    return Object.fromEntries(
      linhas.map((linha) => [linha.categoriaId, Number(linha.total)]),
    );
  }

  // WHERE compartilhado entre a query de dados (paginada) e as duas de
  // contagem (total e por categoria) — pra nunca ter os filtros
  // divergindo entre elas (ex: a busca valendo pra página mas não pro
  // total, deixando "10 resultados" na aba errada).
  private construirQuerySolucoes(
    filtros: Pick<FiltrosSolucaoDto, 'categoria' | 'busca'>,
  ): SelectQueryBuilder<SolucaoConhecida> {
    const query = this.solucaoRepository
      .createQueryBuilder('solucao')
      .innerJoinAndSelect('solucao.chamado', 'chamado')
      .leftJoinAndSelect('chamado.tecnicoResponsavel', 'tecnicoResponsavel')
      // categoria é @ManyToOne + eager, mas eager só se aplica a
      // find()/findOne() — QueryBuilder sempre precisa de JOIN explícito
      // pra popular a relação.
      .leftJoinAndSelect('solucao.categoria', 'categoria')
      // Só entram soluções que o técnico realmente marcou como
      // "reaproveitável" — é essa flag que distingue "chamado finalizado
      // qualquer" de "solução conhecida" (ver regra em ChamadosService).
      .where('solucao.marcadaComo = :marcada', { marcada: true });

    if (filtros.categoria) {
      query.andWhere('categoria.nome = :categoria', {
        categoria: filtros.categoria,
      });
    }

    if (filtros.busca?.trim()) {
      const termo = `%${filtros.busca.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(chamado.titulo) LIKE :termo OR LOWER(solucao.comoFoiResolvido) LIKE :termo OR LOWER(categoria.nome) LIKE :termo)',
        { termo },
      );
    }

    return query;
  }

  // Quantas soluções catalogadas existem por categoria, respeitando a
  // busca ativa mas IGNORANDO o filtro de categoria em si — cada aba
  // precisa saber "quantas teria se eu clicasse nela", não só a contagem
  // da aba já selecionada. Usado pelos números ao lado de cada aba de
  // categoria em ITSolutions.jsx: antes vinham de filtrar a lista inteira
  // em memória no frontend, o que só funcionava porque a lista inteira
  // era carregada de uma vez — agora que a listagem é paginada, isso
  // precisa vir pronto do backend.
  private async contarSolucoesPorCategoria(
    filtros: Pick<FiltrosSolucaoDto, 'busca'>,
  ): Promise<Record<string, number>> {
    const linhas = await this.construirQuerySolucoes({ busca: filtros.busca })
      .select('categoria.nome', 'categoria')
      .addSelect('COUNT(*)', 'total')
      .groupBy('categoria.nome')
      .getRawMany<{ categoria: string; total: string }>();
    return Object.fromEntries(
      linhas.map((linha) => [linha.categoria, Number(linha.total)]),
    );
  }

  async listar(filtros: FiltrosSolucaoDto): Promise<
    RespostaPaginadaDto<SolucaoConhecidaResponseDto> & {
      contagensPorCategoria: Record<string, number>;
    }
  > {
    const { pagina, limite, skip } = calcularPaginacao(
      filtros.pagina,
      filtros.limite,
    );

    const [[solucoes, total], ocorrencias, contagensPorCategoria] =
      await Promise.all([
        this.construirQuerySolucoes(filtros)
          .orderBy('solucao.dataCriacao', 'DESC')
          .skip(skip)
          .take(limite)
          .getManyAndCount(),
        this.contarOcorrenciasPorCategoria(),
        this.contarSolucoesPorCategoria(filtros),
      ]);

    const itens = solucoes.map((solucao) =>
      mapSolucaoParaResposta(solucao, ocorrencias[solucao.categoria.id] ?? 0),
    );
    return {
      ...montarRespostaPaginada(itens, total, pagina, limite),
      contagensPorCategoria,
    };
  }

  // GET /chamados/:id/solucoes-sugeridas — busca soluções conhecidas da
  // MESMA categoria do chamado e ordena pela SIMILARIDADE (índice de
  // Jaccard, ver palavras-chave.util.ts) entre as descrições — proporção
  // de palavras em comum sobre o total de palavras únicas dos dois
  // textos, não uma contagem bruta (contagem bruta sugeria qualquer
  // chamado com só 1 palavra em comum, ex: "pedido", mesmo sem relação
  // real de assunto). Sem IA/embeddings de propósito: é só
  // correspondência de termos, simples o bastante pra explicar numa
  // frase.
  async sugerirParaChamado(
    chamado: Chamado,
  ): Promise<SolucaoSugeridaResponseDto[]> {
    const candidatas = await this.solucaoRepository.find({
      where: { marcadaComo: true, categoria: { id: chamado.categoria.id } },
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
        pontuacao: calcularSimilaridade(
          palavrasDoChamadoAtual,
          extrairPalavrasChave(solucao.chamado.descricao),
        ),
      }))
      // Precisa passar do limiar mínimo de similaridade — "mesma
      // categoria" não basta sozinho, senão qualquer chamado de Hardware
      // sugeriria qualquer outro chamado de Hardware sem relação nenhuma
      // de assunto.
      .filter((item) => item.pontuacao >= LIMIAR_SIMILARIDADE_MINIMA)
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, MAXIMO_SUGESTOES);

    if (pontuadas.length === 0) return [];

    const ocorrencias = await this.contarOcorrenciasPorCategoria();

    return pontuadas.map(({ solucao }) => ({
      chamadoId: solucao.chamado.id,
      resumo: solucao.chamado.titulo,
      comoFoiResolvido: solucao.comoFoiResolvido,
      ocorrenciasCategoria: ocorrencias[chamado.categoria.id] ?? 0,
    }));
  }
}
