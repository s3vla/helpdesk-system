// Período default do Dashboard TI (últimos 30 dias) — compartilhado entre
// DashboardTI.jsx (tela de consulta) e CriarDashboard.jsx (preview ao vivo
// do formulário de widget), pra não duplicar o mesmo cálculo nos dois.
export function formatarDataInput(data) {
  return data.toISOString().slice(0, 10)
}

export function dataFimPadrao() {
  return formatarDataInput(new Date())
}

export function dataInicioPadrao() {
  const data = new Date()
  data.setDate(data.getDate() - 29)
  return formatarDataInput(data)
}
