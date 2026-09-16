export class AcessoColaboradorResponseDto {
  usuarioId: number;
  nome: string | null;
  email: string;
  ultimoAcesso: Date | null;
  inativo: boolean;
  // Complementar a `ultimoAcesso` (que só marca o momento do LOGIN) — ver
  // RelatoriosService.relatorioAcesso e Usuario.ultimaAtividade.
  onlineAgora: boolean;
}
