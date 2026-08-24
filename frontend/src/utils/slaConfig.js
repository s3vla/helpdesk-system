// SLA de resposta por prioridade — único lugar do código onde esses valores
// existem. Pra ajustar o tempo de qualquer prioridade, mexe só aqui.
export const LIMITE_SLA_MINUTOS = {
  alta: 30,
  media: 120,
  baixa: 480,
}

// Formata um limite em minutos pro texto da legenda (ver SlaLegenda.jsx) —
// ex: 30 -> "30 min", 120 -> "2h", 480 -> "8h". Nunca hardcoded fora daqui:
// se LIMITE_SLA_MINUTOS mudar, o texto some sozinho junto.
export function formatarLimiteSla(minutos) {
  if (minutos < 60) return `${minutos} min`
  const horas = minutos / 60
  return Number.isInteger(horas) ? `${horas}h` : `${Math.floor(horas)}h${minutos % 60}min`
}

// A partir de quantos % do limite já decorridos o chamado entra em estado
// de "atenção" (aviso prévio, antes de estourar de verdade). 0.8 = avisa
// quando falta 20% do tempo ou menos.
export const LIMIAR_ATENCAO_SLA = 0.8

// Situação de SLA de um chamado — usado pra decidir cor de destaque e badge
// na Central de Chamados. Só considera 'parado' (Na fila) e 'andamento' (Em
// atendimento); 'finalizado' nunca estoura SLA, por definição.
//
// A referência de tempo muda conforme o estado (ver slaConfig.js no plano
// aprovado com o usuário):
// - 'parado': ainda não foi tocado — conta desde a ABERTURA.
// - 'andamento' aguardando o TÉCNICO responder: conta desde a ÚLTIMA
//   ATUALIZAÇÃO — mesmo campo que a UI já usa hoje pra "sem resposta há
//   Xmin" (ver ITDashboard.jsx), reaproveitado aqui pelo mesmo motivo.
// - 'andamento' aguardando o COLABORADOR responder: o técnico já
//   respondeu, a bola está do outro lado — não faz sentido continuar
//   contando SLA de resposta contra ele, então o relógio "para" (situação
//   sempre 'ok' nesse caso).
export function calcularSituacaoSla(chamado) {
  if (chamado.status !== 'parado' && chamado.status !== 'andamento') {
    return 'ok'
  }
  if (chamado.status === 'andamento' && chamado.aguardandoRespostaDe !== 'TECNICO') {
    return 'ok'
  }

  const referencia = chamado.status === 'parado' ? chamado.created : chamado.updated
  const limiteMinutos = LIMITE_SLA_MINUTOS[chamado.priority]
  if (!referencia || !limiteMinutos) return 'ok'

  const decorridoMs = Date.now() - referencia.getTime()
  const limiteMs = limiteMinutos * 60 * 1000

  if (decorridoMs >= limiteMs) return 'estourado'
  if (decorridoMs >= limiteMs * LIMIAR_ATENCAO_SLA) return 'atencao'
  return 'ok'
}
