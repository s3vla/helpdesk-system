import { Categoria } from '../entities/categoria.entity';
import { NivelChamado } from '../../common/enums/nivel-chamado.enum';

export class CategoriaResponseDto {
  id: number;
  nome: string;
  ativo: boolean;
  nivelPadrao: NivelChamado;
}

export function mapCategoriaParaResposta(
  categoria: Categoria,
): CategoriaResponseDto {
  return {
    id: categoria.id,
    nome: categoria.nome,
    ativo: categoria.ativo,
    nivelPadrao: categoria.nivelPadrao,
  };
}
