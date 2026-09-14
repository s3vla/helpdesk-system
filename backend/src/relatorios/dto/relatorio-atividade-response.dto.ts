export class AtividadeColaboradorResponseDto {
  usuarioId: number;
  nome: string | null;
  email: string;
  totalChamados: number;
  ultimoChamadoEm: Date | null;
}
