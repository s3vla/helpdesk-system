// Resposta de GET /chamados/:id/solucoes-sugeridas — bem mais enxuta que
// SolucaoConhecidaResponseDto de propósito: essa rota é pra um preview
// rápido no painel do técnico, não pra tela cheia de Soluções Conhecidas
// (que já tem tudo, incluindo id/categoria/imagem/quem resolveu).
export class SolucaoSugeridaResponseDto {
  chamadoId: number;
  resumo: string;
  comoFoiResolvido: string;
  ocorrenciasCategoria: number;
}
