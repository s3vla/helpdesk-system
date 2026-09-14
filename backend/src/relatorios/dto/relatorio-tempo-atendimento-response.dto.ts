export class ItemTempoAtendimentoDto {
  chamadoId: number;
  titulo: string;
  dataAbertura: Date;
  primeiraVezEmAtendimento: Date;
  tempoEsperaMinutos: number;
}

export class RelatorioTempoAtendimentoResponseDto {
  itens: ItemTempoAtendimentoDto[];
  mediaGeralMinutos: number | null;
  maisDemorados: ItemTempoAtendimentoDto[];
  // Chamados do período que nunca chegaram a ANDAMENTO (foram direto pra
  // FINALIZADO, ou continuam parados) — não entram em `itens` nem na
  // média, mas contados aqui pra o relatório não passar a impressão
  // enganosa de que todo chamado do período teve tempo de espera medido.
  totalSemTransicaoParaAtendimento: number;
}
