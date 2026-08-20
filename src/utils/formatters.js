// Funções puras de formatação, sem estado — por isso ficam fora de components/.

export function formatarData(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatarHora(data) {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function tempoDecorrido(data) {
  const minutos = Math.floor((Date.now() - data.getTime()) / 60000)
  if (minutos < 60) return `${minutos}min atrás`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas}h atrás`
  return `${Math.floor(horas / 24)}d atrás`
}

export function obterIniciais(nome) {
  return nome.split(' ').map(palavra => palavra[0]).slice(0, 2).join('').toUpperCase()
}
