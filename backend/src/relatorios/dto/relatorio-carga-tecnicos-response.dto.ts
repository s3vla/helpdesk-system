export class CargaTecnicoResponseDto {
  tecnicoId: number;
  nome: string | null;
  email: string;
  totalChamados: number;
  totalFinalizados: number;
  // null quando totalFinalizados === 0 — sem chamado finalizado no
  // período, não tem o que tirar média.
  tempoMedioResolucaoMinutos: number | null;
}
