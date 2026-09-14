export class ChamadoReabertoDto {
  chamadoId: number;
  titulo: string;
  totalReaberturas: number;
  // Quem estava responsável pelo chamado (cuja resolução foi reaberta) —
  // null no caso raro de um chamado reaberto que nunca chegou a ter um
  // técnico responsável atribuído.
  tecnicoResponsavelId: number | null;
  tecnicoResponsavelNome: string | null;
}

export class TecnicoReaberturasResponseDto {
  tecnicoId: number;
  nome: string | null;
  email: string;
  totalReaberturas: number;
}

export class RelatorioReaberturasResponseDto {
  // Todo chamado com pelo menos 1 reabertura no período, ordenado por
  // totalReaberturas desc.
  porChamado: ChamadoReabertoDto[];
  // Subconjunto de `porChamado` com totalReaberturas >= 2 — destaque
  // pedido explicitamente.
  destaque: ChamadoReabertoDto[];
  // Somado por técnico responsável, ordenado por totalReaberturas desc —
  // só técnicos com pelo menos 1 reabertura aparecem aqui (diferente dos
  // outros relatórios, que zero-preenchem; aqui um "0" pra todo técnico
  // sem reabertura só adicionaria ruído numa lista de identificar padrão).
  porTecnico: TecnicoReaberturasResponseDto[];
}
