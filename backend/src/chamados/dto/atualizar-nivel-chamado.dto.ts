import { IsEnum } from 'class-validator';
import { NivelChamado } from '../../common/enums/nivel-chamado.enum';

// Corpo de PATCH /chamados/:id/nivel — reclassificação manual, pro técnico
// corrigir os casos em que a regra automática (nivel-triagem.util.ts)
// classificou errado. Ver ChamadosService.reclassificarNivel: a mudança
// gera um comentário interno automático, servindo de histórico de quantas
// vezes a sugestão automática precisou de ajuste.
export class AtualizarNivelChamadoDto {
  @IsEnum(NivelChamado, { message: 'Nível inválido' })
  nivel: NivelChamado;
}
