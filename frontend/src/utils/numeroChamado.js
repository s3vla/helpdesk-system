// "Número do chamado" exibido pra quem usa o sistema — nunca gravado no
// banco, sempre derivado do id (id=1 -> #1001). O offset de 1000 é só
// cosmético (evita numeração "#1", "#2" que soaria como um sistema
// recém-nascido); o backend espelha essa mesma conta ao aceitar busca por
// número (ver ChamadosService.listarTodos no backend).
export function numeroChamado(id) {
  return `#${1000 + Number(id)}`
}
