import { Categoria } from '../entities/categoria.entity';

export class CategoriaResponseDto {
  id: number;
  nome: string;
  ativo: boolean;
  consideradaRede: boolean;
}

export function mapCategoriaParaResposta(
  categoria: Categoria,
): CategoriaResponseDto {
  return {
    id: categoria.id,
    nome: categoria.nome,
    ativo: categoria.ativo,
    consideradaRede: categoria.consideradaRede,
  };
}
