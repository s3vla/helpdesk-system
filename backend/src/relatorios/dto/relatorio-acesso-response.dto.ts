export class AcessoColaboradorResponseDto {
  usuarioId: number;
  nome: string | null;
  email: string;
  ultimoAcesso: Date | null;
  inativo: boolean;
}
