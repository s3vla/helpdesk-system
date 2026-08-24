import { StatusTarefa } from '../../common/enums/status-tarefa.enum';
import { Tarefa } from '../entities/tarefa.entity';

// Sem `usuario` na resposta de propósito — a tarefa é sempre "minha" (toda
// rota já filtra por usuarioAtual.sub antes de chegar aqui), não tem
// nenhuma tela que precise mostrar de quem é.
export class TarefaResponseDto {
  id: number;
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  criadaEm: Date;
  atualizadaEm: Date;
}

export function mapTarefaParaResposta(tarefa: Tarefa): TarefaResponseDto {
  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    status: tarefa.status,
    criadaEm: tarefa.criadaEm,
    atualizadaEm: tarefa.atualizadaEm,
  };
}
