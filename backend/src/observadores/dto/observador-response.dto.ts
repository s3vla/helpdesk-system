import { ChamadoObservador } from '../entities/chamado-observador.entity';

// Deliberadamente mais enxuto que UsuarioResponseDto (só id/nome/email,
// como pedido no desenho) — é só pra exibir a lista de "Cc" no painel, não
// precisa de cargo/departamento/tipo/etc.
export class ObservadorResponseDto {
  id: number;
  nome: string | null;
  email: string;
}

export function mapObservadorParaResposta(
  observador: ChamadoObservador,
): ObservadorResponseDto {
  return {
    id: observador.usuario.id,
    nome: observador.usuario.nome,
    email: observador.usuario.email,
  };
}
