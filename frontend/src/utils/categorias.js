// LABEL_CATEGORIA: cosmético, opcional — só existe pra dar um texto mais
// "leigo" às 5 categorias originais (ex: "Internet/Wi-Fi" em vez de
// "Rede"), igual antes. Não é mais a FONTE de quais categorias existem
// (isso agora vem do backend, ver categoriasService.js — a categoria virou
// uma tabela administrável em Administração → Categorias, não um enum
// fixo). Qualquer categoria nova criada pelo técnico simplesmente não tem
// entrada aqui — quem usa este dicionário sempre faz `LABEL_CATEGORIA[nome]
// ?? nome`, caindo de volta no nome cru nesse caso.
export const LABEL_CATEGORIA = {
  Hardware: 'Computador/Impressora',
  Software: 'Programas',
  Rede: 'Internet/Wi-Fi',
  Acesso: 'Sistema',
  Outro: 'Outro',
}
