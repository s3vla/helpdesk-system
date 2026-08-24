import { AvisoLeitura } from '../entities/aviso-leitura.entity';

// GET /avisos/:id/leitores (TECNICO-only) — lista enxuta, só o necessário
// pra exibir "quem já leu" (nome/e-mail/quando), sem os outros campos de
// UsuarioResponseDto (departamento, tipo, deveTrocarSenha...) que não fazem
// sentido nesse contexto.
export class LeitorAvisoResponseDto {
  id: number;
  nome: string | null;
  email: string;
  lidoEm: Date;
}

export function mapLeituraParaLeitorResposta(
  leitura: AvisoLeitura,
): LeitorAvisoResponseDto {
  return {
    id: leitura.usuario.id,
    nome: leitura.usuario.nome,
    email: leitura.usuario.email,
    lidoEm: leitura.lidoEm,
  };
}
