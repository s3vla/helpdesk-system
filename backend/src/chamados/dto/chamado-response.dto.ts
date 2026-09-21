import { PrioridadeChamado } from '../../common/enums/prioridade-chamado.enum';
import { NivelChamado } from '../../common/enums/nivel-chamado.enum';
import { StatusChamado } from '../../common/enums/status-chamado.enum';
import { TipoUsuario } from '../../common/enums/tipo-usuario.enum';
import { Chamado } from '../entities/chamado.entity';
import {
  mapUsuarioParaResposta,
  UsuarioResponseDto,
} from '../../usuarios/dto/usuario-response.dto';
import {
  mapObservadorParaResposta,
  ObservadorResponseDto,
} from '../../observadores/dto/observador-response.dto';

export class SolucaoResumoDto {
  comoFoiResolvido: string;
  marcadaComo: boolean;
  imagensUrls: string[];
  dataCriacao: Date;
}

export class ChamadoResponseDto {
  id: number;
  titulo: string;
  descricao: string;
  mensagemErro: string | null;
  // Nome da categoria (não mais o enum cru) — o próprio nome já É o
  // valor final de exibição agora, sem tradução de camada nenhuma (ver
  // Categoria entity).
  categoria: string;
  prioridade: PrioridadeChamado;
  nivel: NivelChamado;
  status: StatusChamado;
  // Só relevante com status === ANDAMENTO — vem null em qualquer outro
  // status (ver Chamado.aguardandoRespostaDe e ChamadosService).
  aguardandoRespostaDe: TipoUsuario | null;
  imagensUrls: string[];
  // Visível pra colaborador (dono do chamado) e técnico igual, sem
  // tratamento diferenciado — é dado que o próprio colaborador informou,
  // então ele também precisa ver de volta pra confirmar que digitou certo.
  // Só a AÇÃO de conectar (botão no painel) é exclusiva do técnico, e isso
  // é decidido inteiramente no frontend, não aqui.
  anydeskId: string | null;
  dataAbertura: Date;
  dataAtualizacao: Date;
  solicitante: UsuarioResponseDto;
  tecnicoResponsavel: UsuarioResponseDto | null;
  // Auditoria: só preenchido quando o chamado foi aberto por um técnico em
  // nome do solicitante (POST /chamados/tecnico) — null no fluxo normal
  // (POST /chamados, o próprio colaborador abrindo). `solicitante` acima
  // continua sendo o dono real do chamado nos dois casos.
  abertoPorTecnico: UsuarioResponseDto | null;
  // Só existe quando status === FINALIZADO. Vem preenchido mesmo que o
  // técnico NÃO tenha marcado como "solução conhecida" — aquela flag só
  // decide se aparece em GET /solucoes-conhecidas, mas o painel de
  // atendimento do próprio chamado precisa mostrar "como foi resolvido"
  // sempre, marcado ou não.
  solucao: SolucaoResumoDto | null;
  // "Cc" do chamado — ver ObservadoresService. Sempre um array (nunca
  // null), vazio quando ninguém foi adicionado.
  observadores: ObservadorResponseDto[];
}

// Centraliza a montagem da resposta — assim toda rota que devolve um
// Chamado (criar, listar, detalhe, atualizar status) usa exatamente o
// mesmo formato, sem risco de um endpoint esquecer de omitir algum dado
// sensível dos usuários relacionados (ver mapUsuarioParaResposta).
export function mapChamadoParaResposta(chamado: Chamado): ChamadoResponseDto {
  return {
    id: chamado.id,
    titulo: chamado.titulo,
    descricao: chamado.descricao,
    mensagemErro: chamado.mensagemErro,
    categoria: chamado.categoria.nome,
    prioridade: chamado.prioridade,
    nivel: chamado.nivel,
    status: chamado.status,
    aguardandoRespostaDe: chamado.aguardandoRespostaDe,
    imagensUrls: chamado.imagensUrls,
    anydeskId: chamado.anydeskId,
    dataAbertura: chamado.dataAbertura,
    dataAtualizacao: chamado.dataAtualizacao,
    solicitante: mapUsuarioParaResposta(chamado.solicitante),
    tecnicoResponsavel: chamado.tecnicoResponsavel
      ? mapUsuarioParaResposta(chamado.tecnicoResponsavel)
      : null,
    abertoPorTecnico: chamado.abertoPorTecnico
      ? mapUsuarioParaResposta(chamado.abertoPorTecnico)
      : null,
    solucao: chamado.solucaoConhecida
      ? {
          comoFoiResolvido: chamado.solucaoConhecida.comoFoiResolvido,
          marcadaComo: chamado.solucaoConhecida.marcadaComo,
          imagensUrls: chamado.solucaoConhecida.imagensUrls,
          dataCriacao: chamado.solucaoConhecida.dataCriacao,
        }
      : null,
    observadores: (chamado.observadores ?? []).map(mapObservadorParaResposta),
  };
}
