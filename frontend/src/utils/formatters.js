// Funções puras de formatação, sem estado — por isso ficam fora de components/.

export function formatarData(data) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatarHora(data) {
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatarDataHora(data) {
  return `${formatarData(data)} ${formatarHora(data)}`
}

// Converte um Date (ou string ISO, ex: vinda da API) pro formato cru que
// <input type="datetime-local"> espera ("YYYY-MM-DDTHH:mm"). Usa os
// getters LOCAIS do Date (getFullYear/getMonth/...), nunca
// toISOString().slice(...) — essa troca é justamente o que causou o bug de
// fuso horário já visto antes (toISOString() converte pra UTC antes de
// fatiar, deslocando a data/hora exibida em relação ao horário local
// escolhido pela pessoa).
export function paraDatetimeLocal(dataOuIso) {
  const d = typeof dataOuIso === 'string' ? new Date(dataOuIso) : dataOuIso
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
