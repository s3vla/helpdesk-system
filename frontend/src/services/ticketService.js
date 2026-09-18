// Camada de acesso a dados — agora conversando de verdade com a API
// (novatech-helpdesk-api), documentada em CONTRATO.md. Cada função aqui é a
// mesma que existia quando os dados eram mockados; só o corpo mudou (de
// "retorna array fixo" para "chama a API"), então nenhum componente de tela
// precisou saber que essa troca aconteceu.
//
// Duas responsabilidades extras que só fazem sentido aqui, na fronteira com
// a API:
// 1. Tradução de enum: a API usa maiúsculas (PARADO, BAIXA...); o resto do
//    app usa os valores em minúsculo que já existiam desde o protótipo
//    (mantidos para não precisar reescrever StatusBadge, PriorityChip, os
//    filtros de cada tela etc.). Categoria NÃO entra mais nessa tradução —
//    desde que virou uma tabela administrável (Categoria, ver backend), o
//    `nome` que a API manda já É o valor final de exibição, sem um "rótulo
//    interno" separado (o técnico digita o nome que quer ver na tela).
// 2. Tradução de formato: a API responde em português (titulo, descricao,
//    solicitante...); os componentes esperam os nomes em inglês herdados do
//    protótipo original (summary, description, userId...). mapearChamado
//    faz essa ponte numa única função, testável e fácil de achar.

import { chamarApi } from './apiClient'

const STATUS_PARA_API = { parado: 'PARADO', andamento: 'ANDAMENTO', finalizado: 'FINALIZADO' }
const STATUS_DA_API = { PARADO: 'parado', ANDAMENTO: 'andamento', FINALIZADO: 'finalizado' }
const PRIORIDADE_PARA_API = { baixa: 'BAIXA', media: 'MEDIA', alta: 'ALTA' }

// Exportada (diferente das outras funções de mapeamento) porque o
// AuthContext também precisa dela: o usuário devolvido por /auth/login e
// /auth/primeiro-acesso vem no mesmo formato bruto da API, e precisa virar
// o mesmo formato em inglês que EmployeeLayout e as demais telas já usam.
export function mapearUsuario(u) {
  if (!u) return null
  return {
    id: String(u.id),
    // Nulos quando a conta foi resetada (e-mail de cargo aguardando novo
    // responsável) — telas que exibem `name`/`role` precisam de um
    // fallback (`?? '—'`), ver `emAguardoDeCadastro`.
    name: u.nome,
    email: u.email,
    role: u.cargo,
    dept: u.departamento,
    tipo: u.tipo,
    emAguardoDeCadastro: u.emAguardoDeCadastro ?? false,
    // true só pros 2 técnicos de seed até a primeira troca de senha —
    // AuthContext usa isso pra forçar a tela de troca antes do Painel TI.
    deveTrocarSenha: u.deveTrocarSenha ?? false,
    // Só presentes na resposta de GET /usuarios (tela Colaboradores) — os
    // outros usos deste mapeador (login, SolicitanteSelect etc.) simplesmente
    // não têm esses campos, e ficam undefined sem problema.
    totalChamados: u.totalChamados,
    chamadosAbertos: u.chamadosAbertos,
    chamadosFinalizados: u.chamadosFinalizados,
  }
}

function mapearChamado(c) {
  return {
    id: String(c.id),
    userId: String(c.solicitante.id),
    // A resposta da API já traz o solicitante inteiro embutido — expor o
    // nome/departamento direto aqui evita que ITDashboard/TicketPanel
    // precisem buscar a lista de usuários só pra mostrar quem abriu o
    // chamado.
    solicitanteNome: c.solicitante.nome,
    solicitanteDept: c.solicitante.departamento,
    summary: c.titulo,
    description: c.descricao,
    errorMsg: c.mensagemErro ?? undefined,
    status: STATUS_DA_API[c.status],
    // Só tem valor com status "andamento" — o backend já garante isso
    // (null em qualquer outro status), mantido como veio (TECNICO |
    // COLABORADOR | null), sem tradução: mesmo padrão de `usuario.tipo`,
    // que também fica em maiúsculas no restante do app (ver App.jsx).
    aguardandoRespostaDe: c.aguardandoRespostaDe,
    priority: c.prioridade.toLowerCase(),
    level: c.nivel,
    category: c.categoria,
    created: new Date(c.dataAbertura),
    updated: new Date(c.dataAtualizacao),
    assignedTo: c.tecnicoResponsavel?.nome,
    assignedToId: c.tecnicoResponsavel ? String(c.tecnicoResponsavel.id) : null,
    // Auditoria: só existe quando um TÉCNICO abriu este chamado em nome do
    // colaborador (POST /chamados/tecnico) — null no fluxo normal. Nunca
    // é o "dono" do chamado, isso continua sendo `userId`/`solicitanteNome`
    // acima; ver TicketPanel (indicação "Aberto por ..." só pro lado TI).
    abertoPorTecnicoNome: c.abertoPorTecnico?.nome,
    // Sempre um array (a API nunca manda null aqui, ver Chamado.imagensUrls
    // no backend) — vazio quando nenhum arquivo foi anexado.
    imagens: c.imagensUrls,
    anydeskId: c.anydeskId,
    // "Cc" do chamado — ver adicionarObservador/removerObservador. Sempre
    // um array (a API nunca manda null aqui).
    observers: c.observadores.map(o => ({ id: String(o.id), name: o.nome, email: o.email })),
    resolution: c.solucao
      ? {
          text: c.solucao.comoFoiResolvido,
          isKnownSolution: c.solucao.marcadaComo,
          resolvedAt: new Date(c.solucao.dataCriacao),
          resolvedBy: c.tecnicoResponsavel?.nome,
        }
      : undefined,
  }
}

function mapearSugestao(s) {
  return {
    chamadoId: String(s.chamadoId),
    summary: s.resumo,
    resolutionText: s.comoFoiResolvido,
    ocorrenciasCategoria: s.ocorrenciasCategoria,
  }
}

function mapearComentario(c) {
  return {
    // String() no id do autor porque usuario.id (AuthContext, ver
    // mapearUsuario acima) também é sempre string — comparação teria
    // silenciosamente falhado sempre (number !== string) em
    // podeEditarComentario, escondendo o botão de editar até pra quem é
    // dono do comentário.
    id: String(c.id), authorId: String(c.autor.id), author: c.autor.nome, text: c.texto, date: new Date(c.dataCriacao),
    internal: c.interno, imagensUrls: c.imagensUrls, isObserver: c.ehObservador,
    // NIVEL_AJUSTADO é a entrada automática de auditoria gerada ao
    // reclassificar o nível (ver PATCH /chamados/:id/nivel) — o painel usa
    // isso pra mostrar esse histórico separado da conversa de verdade, em
    // vez de misturado nela. Também nunca editável (ver
    // ComentariosService.editar, no backend).
    isLevelChange: c.tipo === 'NIVEL_AJUSTADO',
    editedAt: c.editadoEm ? new Date(c.editadoEm) : null,
  }
}

// Rótulo em português de cada `acao` do log de auditoria — mesma ideia de
// STATUS_DA_API acima, só que pra um enum que só existe pro "Histórico de
// alterações" (painel de TI).
const LABEL_ACAO_AUDITORIA = {
  MUDANCA_STATUS: 'Status alterado',
  REABERTURA: 'Chamado reaberto',
  ATRIBUICAO: 'Responsável alterado',
  EDICAO: 'Campo editado',
  COMENTARIO: 'Comentário',
}

function mapearLogAuditoria(l) {
  return {
    id: String(l.id),
    acao: l.acao,
    acaoLabel: LABEL_ACAO_AUDITORIA[l.acao] ?? l.acao,
    description: l.descricao,
    date: new Date(l.dataHora),
    // Usuário pode ter sido resetado desde então (ver `emAguardoDeCadastro`
    // em outros mapeamentos) — mesmo fallback já usado em MyTickets.jsx pro
    // solicitante nesse caso.
    userName: l.usuario?.nome ?? '(conta resetada)',
  }
}

function mapearSolucao(s) {
  return {
    id: String(s.chamadoId),
    category: s.categoria,
    summary: s.tituloChamado,
    description: s.descricaoChamado,
    ocorrenciasCategoria: s.ocorrenciasCategoria,
    resolution: {
      text: s.comoFoiResolvido,
      isKnownSolution: s.marcadaComo,
      resolvedAt: new Date(s.dataCriacao),
      resolvedBy: s.resolvidoPor?.nome,
      // Sempre um array (a API nunca manda null aqui, ver
      // SolucaoConhecida.imagensUrls no backend) — vazio quando nenhum
      // print foi anexado. Mesmo nome (`imagens`) de mapearChamado, pro
      // mesmo componente de galeria (ver TicketPanel.jsx) servir os dois.
      imagens: s.imagensUrls,
    },
  }
}

// ── Chamados ─────────────────────────────────────────────────────────────

// Toda listagem paginada da API devolve { itens, total, pagina,
// totalPaginas } — este helper aplica `mapear` só em `itens` e repassa o
// resto do envelope como veio, pra não repetir esse spread em cada
// função de busca da lista (ver Paginacao.jsx, que consome exatamente
// esse formato).
function mapearRespostaPaginada(resposta, mapear) {
  return { ...resposta, itens: resposta.itens.map(mapear) }
}

// `busca` cobre os 3 status de uma vez (Parado/Em andamento/Finalizado)
// quando `status` não é passado — mesma lógica de busca de
// GET /chamados?busca=, só aplicada aos chamados do próprio usuário do
// token (ver ChamadosService.listarPorUsuario).
//
// Com `status`: busca só aquela coluna, com `limite` controlando quantos
// itens (mais recentes primeiro) — é o que permite MyTickets.jsx paginar
// Parado/Em andamento/Finalizado de forma independente, cada uma com seu
// próprio "carregar mais" (ver useListaCarregarMais), em vez de trazer o
// histórico inteiro de uma vez só (pensando em anos de chamados
// acumulados).
export async function buscarMeusChamados(token, { busca = '', status, limite } = {}) {
  const params = new URLSearchParams()
  if (busca.trim()) params.set('busca', busca.trim())
  if (status) params.set('status', STATUS_PARA_API[status])
  if (limite) params.set('limite', limite)
  const resposta = await chamarApi(`/chamados/meus?${params.toString()}`, { token })
  return mapearRespostaPaginada(resposta, mapearChamado)
}

// Chamados onde o usuário do token é observador ("Cc") — lista separada
// de "meus chamados" mesmo que o mesmo usuário apareça nas duas, pra
// chamados diferentes (ver CONTRATO.md).
export async function buscarChamadosObservando(token, pagina = 1) {
  const resposta = await chamarApi(`/chamados/observando?pagina=${pagina}`, { token })
  return mapearRespostaPaginada(resposta, mapearChamado)
}

export async function buscarChamadosTI(token, filtros = {}) {
  const params = new URLSearchParams()
  if (filtros.status && filtros.status !== 'all') params.set('status', STATUS_PARA_API[filtros.status])
  if (filtros.nivel && filtros.nivel !== 'all') params.set('nivel', filtros.nivel)
  if (filtros.categoria && filtros.categoria !== 'all') params.set('categoria', filtros.categoria)
  if (filtros.busca?.trim()) params.set('busca', filtros.busca.trim())
  params.set('pagina', filtros.pagina ?? 1)
  if (filtros.limite) params.set('limite', filtros.limite)
  const resposta = await chamarApi(`/chamados?${params.toString()}`, { token })
  // `contagensPorStatus` vem com as chaves em maiúsculo (enum cru do
  // backend) — traduz pro mesmo formato minúsculo que `chamado.status` já
  // usa no resto do frontend (ver STATUS_DA_API), pra quem consome não
  // precisar saber dos dois formatos.
  const contagensPorStatus = Object.fromEntries(
    Object.entries(resposta.contagensPorStatus ?? {}).map(([status, total]) => [STATUS_DA_API[status] ?? status, total]),
  )
  return { ...mapearRespostaPaginada(resposta, mapearChamado), contagensPorStatus }
}

export async function buscarChamado(token, chamadoId) {
  const chamado = await chamarApi(`/chamados/${chamadoId}`, { token })
  return mapearChamado(chamado)
}

// Deriva o título a partir dos primeiros caracteres da descrição — o
// formulário de abertura de chamado nunca teve um campo de título separado,
// então mantemos esse mesmo comportamento do protótipo original.
export async function criarChamado(token, { descricao, mensagemErro, categoria, prioridade, imagensUrls, anydeskId }) {
  const chamado = await chamarApi('/chamados', {
    token,
    metodo: 'POST',
    corpo: {
      titulo: descricao.slice(0, 65),
      descricao,
      mensagemErro: mensagemErro || undefined,
      categoria,
      prioridade: PRIORIDADE_PARA_API[prioridade],
      imagensUrls: imagensUrls?.length ? imagensUrls : undefined,
      anydeskId: anydeskId || undefined,
    },
  })
  return mapearChamado(chamado)
}

// GET /chamados/verificar-semelhantes — chamado enquanto o colaborador
// ainda está PREENCHENDO o formulário "Abrir chamado" (CreateTicket.jsx),
// com debounce, pra avisar se ele já tem algo parecido em aberto antes de
// duplicar. Sempre olha só os PRÓPRIOS chamados de quem está logado (o
// backend decide isso pelo token, nunca por um id daqui) — diferente de
// solucoes-sugeridas (TECNICO-only, sobre um chamado já existente).
export async function buscarChamadosSemelhantes(token, { categoria, texto }) {
  const params = new URLSearchParams()
  params.set('categoria', categoria)
  params.set('texto', texto)
  return chamarApi(`/chamados/verificar-semelhantes?${params.toString()}`, { token })
}

// Técnico abre um chamado em nome de um colaborador (cenário "colega
// ligou/pediu pessoalmente") — mesmo corpo de criarChamado() acima, mais
// `solicitanteId`. Ainda deriva o título a partir da descrição, mesma
// regra do formulário do colaborador (nunca existiu campo de título
// separado em nenhum dos dois fluxos).
export async function abrirChamadoComoTecnico(token, { solicitanteId, descricao, mensagemErro, categoria, prioridade, imagensUrls, anydeskId }) {
  const chamado = await chamarApi('/chamados/tecnico', {
    token,
    metodo: 'POST',
    corpo: {
      solicitanteId: Number(solicitanteId),
      titulo: descricao.slice(0, 65),
      descricao,
      mensagemErro: mensagemErro || undefined,
      categoria,
      prioridade: PRIORIDADE_PARA_API[prioridade],
      imagensUrls: imagensUrls?.length ? imagensUrls : undefined,
      anydeskId: anydeskId || undefined,
    },
  })
  return mapearChamado(chamado)
}

export async function atualizarStatusChamado(token, chamadoId, { status, comoFoiResolvido, marcadaComo, imagensUrlsSolucao }) {
  const chamado = await chamarApi(`/chamados/${chamadoId}/status`, {
    token,
    metodo: 'PATCH',
    corpo: {
      status: STATUS_PARA_API[status],
      ...(comoFoiResolvido !== undefined ? { comoFoiResolvido } : {}),
      ...(marcadaComo !== undefined ? { marcadaComo } : {}),
      ...(imagensUrlsSolucao?.length ? { imagensUrlsSolucao } : {}),
    },
  })
  return mapearChamado(chamado)
}

// Reclassificação manual de nível (N1/N2/N3) — corrige a sugestão
// automática (categoria + palavra-chave, ver CONTRATO.md) quando ela erra.
// `nivel` já vem/vai como 'N1'|'N2'|'N3' sem tradução, porque esse enum é
// igual em português e inglês.
export async function atualizarNivelChamado(token, chamadoId, nivel) {
  const chamado = await chamarApi(`/chamados/${chamadoId}/nivel`, {
    token,
    metodo: 'PATCH',
    corpo: { nivel },
  })
  return mapearChamado(chamado)
}

// PATCH /chamados/:id/prioridade — solicitante ou técnico (backend valida
// os dois casos e recusa qualquer outro colaborador). `prioridade` chega
// aqui como 'baixa'|'media'|'alta' (mesmo formato de `chamado.priority`),
// PRIORIDADE_PARA_API traduz pro enum maiúsculo que a API espera.
export async function atualizarPrioridadeChamado(token, chamadoId, prioridade) {
  const chamado = await chamarApi(`/chamados/${chamadoId}/prioridade`, {
    token,
    metodo: 'PATCH',
    corpo: { prioridade: PRIORIDADE_PARA_API[prioridade] },
  })
  return mapearChamado(chamado)
}

// Define/troca/remove (null) o técnico responsável — diferente de
// atualizarStatusChamado(status: 'andamento'), que só auto-atribui o
// próprio técnico logado, esta permite escolher QUALQUER técnico da lista
// (ver buscarTecnicos abaixo). `tecnicoId: null` desatribui.
export async function atribuirChamado(token, chamadoId, tecnicoId) {
  const chamado = await chamarApi(`/chamados/${chamadoId}/atribuir`, {
    token,
    metodo: 'PATCH',
    corpo: { tecnicoId: tecnicoId ? Number(tecnicoId) : null },
  })
  return mapearChamado(chamado)
}

// "Cc" do chamado — adiciona/remove um colaborador como observador, sem
// transferir a titularidade (o solicitante continua sendo quem abriu).
// Ambas retornam o Chamado atualizado (já com a lista de observadores nova).
export async function adicionarObservador(token, chamadoId, usuarioId) {
  const chamado = await chamarApi(`/chamados/${chamadoId}/observadores`, {
    token,
    metodo: 'POST',
    corpo: { usuarioId: Number(usuarioId) },
  })
  return mapearChamado(chamado)
}

export async function removerObservador(token, chamadoId, usuarioId) {
  const chamado = await chamarApi(`/chamados/${chamadoId}/observadores/${usuarioId}`, {
    token,
    metodo: 'DELETE',
  })
  return mapearChamado(chamado)
}

// Sugestões automáticas de soluções parecidas (mesma categoria + palavras
// em comum na descrição, calculado no backend). Usada só pelo painel do
// técnico, num chamado ainda não finalizado.
export async function buscarSolucoesSugeridas(token, chamadoId) {
  const sugestoes = await chamarApi(`/chamados/${chamadoId}/solucoes-sugeridas`, { token })
  return sugestoes.map(mapearSugestao)
}

// "Histórico de alterações" (painel de TI, TicketPanel isIT) — trilha de
// auditoria somente leitura, separada do "Histórico de comentários".
export async function buscarLogsAuditoria(token, chamadoId) {
  const logs = await chamarApi(`/chamados/${chamadoId}/logs`, { token })
  return logs.map(mapearLogAuditoria)
}

// ── Comentários ──────────────────────────────────────────────────────────

export async function buscarComentarios(token, chamadoId) {
  const comentarios = await chamarApi(`/chamados/${chamadoId}/comentarios`, { token })
  return comentarios.map(mapearComentario)
}

export async function criarComentario(token, chamadoId, { texto, interno, imagensUrls }) {
  const comentario = await chamarApi(`/chamados/${chamadoId}/comentarios`, {
    token,
    metodo: 'POST',
    corpo: { texto, interno, ...(imagensUrls?.length ? { imagensUrls } : {}) },
  })
  return mapearComentario(comentario)
}

// PATCH /comentarios/:id — controller próprio, sem chamadoId na URL (ver
// ComentariosController no backend). Regras (autor, janela de 15min, não
// finalizado, não é registro automático) são checadas no backend; o
// frontend só evita OFERECER o botão fora dessas condições, mas a validação
// de verdade é sempre lá (ver TicketPanel.jsx).
export async function editarComentario(token, comentarioId, texto) {
  const comentario = await chamarApi(`/comentarios/${comentarioId}`, {
    token,
    metodo: 'PATCH',
    corpo: { texto },
  })
  return mapearComentario(comentario)
}

// ── Colaboradores (painel de TI) ────────────────────────────────────────

// Sem `pagina`: usado pelos dropdowns que precisam da lista INTEIRA pra
// escolher de quem (TicketPanel "Adicionar observador", ITAbrirChamado
// "Solicitante") — manda um limite bem alto pra não cair no padrão de 10
// da API. Com `pagina`: usado pela tela "Colaboradores" (ITUsers.jsx),
// que aí sim pagina de verdade.
// `busca`: nome OU e-mail, parcial (ver ITUsers.jsx) — repassado direto pro
// backend, mesmo padrão de busca já usado em Central de Chamados/Fórum
// (?busca=, filtrando no servidor, não em memória).
export async function buscarColaboradores(token, { pagina, porPagina, busca, statusChamado } = {}) {
  const params = new URLSearchParams()
  if (pagina) {
    params.set('pagina', pagina)
    // Padrão da API é 10 por página (ver LIMITE_PADRAO no backend,
    // compartilhado por toda listagem paginada) — ITUsers.jsx manda um
    // valor maior só pra ELA, sem mexer nesse padrão compartilhado, que
    // outras telas (Meus Chamados, Minhas Tarefas etc.) continuam usando.
    if (porPagina) params.set('limite', porPagina)
  } else {
    params.set('limite', 10000)
  }
  if (busca?.trim()) params.set('busca', busca.trim())
  // 'parado'/'andamento'/'finalizado' — mesma convenção minúscula das
  // pílulas de status de ITDashboard.jsx, repassada direto (o backend
  // converte pro enum maiúsculo, ver UsuariosService.listarColaboradores).
  if (statusChamado) params.set('statusChamado', statusChamado)
  const resposta = await chamarApi(`/usuarios?${params.toString()}`, { token })
  return mapearRespostaPaginada(resposta, mapearUsuario)
}

// Popula o dropdown "Atribuído a" no painel de atendimento (TicketPanel,
// isIT) — filtro oposto de buscarColaboradores: só quem pode ser
// responsável por um chamado.
export async function buscarTecnicos(token) {
  const usuarios = await chamarApi('/usuarios/tecnicos', { token })
  return usuarios.map(mapearUsuario)
}

export async function buscarChamadosDoColaborador(token, usuarioId) {
  const chamados = await chamarApi(`/usuarios/${usuarioId}/chamados`, { token })
  return chamados.map(mapearChamado)
}

// Apaga nome/cargo/senha da conta, liberando o e-mail pra rodar Primeiro
// Acesso de novo — usado quando um e-mail de cargo (ex: faturamento02@)
// muda de responsável. Ver CONTRATO.md para o efeito colateral: chamados
// antigos vinculados a essa conta passam a mostrar o nome de quem
// completar o próximo Primeiro Acesso, não de quem os abriu originalmente.
export async function resetarConta(token, usuarioId) {
  const usuario = await chamarApi(`/usuarios/${usuarioId}/resetar`, { token, metodo: 'PATCH' })
  return mapearUsuario(usuario)
}

// Cadastro de colaborador feito DIRETO pelo técnico (Administração →
// Colaboradores) — em paralelo ao Primeiro Acesso self-service (LoginScreen
// → FirstAccessModal), não no lugar dele. Diferente de tudo que já existe
// nesta camada: não devolve token nenhum (quem chama é o TÉCNICO logado,
// não o colaborador recém-criado — ver AuthService.cadastrarColaborador).
// `dados`: { email, nome, senha, cargo? }.
export async function cadastrarColaborador(token, dados) {
  const usuario = await chamarApi('/auth/cadastrar-colaborador', { token, metodo: 'POST', corpo: dados })
  return mapearUsuario(usuario)
}

// ── Soluções conhecidas ──────────────────────────────────────────────────

// `contagensPorCategoria` vem pronto do backend (ver
// SolucoesConhecidasService.contarSolucoesPorCategoria) — antes era
// calculado no frontend filtrando a lista inteira já carregada, o que só
// funcionava sem paginação; agora que a listagem é paginada, o back
// precisa mandar isso pronto.
export async function buscarSolucoesConhecidas(token, { busca = '', categoria, pagina = 1 } = {}) {
  const params = new URLSearchParams()
  if (busca.trim()) params.set('busca', busca.trim())
  if (categoria && categoria !== 'all') params.set('categoria', categoria)
  params.set('pagina', pagina)
  const resposta = await chamarApi(`/solucoes-conhecidas?${params.toString()}`, { token })
  // Chaves já vêm no nome final da categoria — sem tradução (ver comentário
  // no topo do arquivo).
  const contagensPorCategoria = resposta.contagensPorCategoria ?? {}
  return { ...mapearRespostaPaginada(resposta, mapearSolucao), contagensPorCategoria }
}

// ── Upload de imagem ─────────────────────────────────────────────────────

// Retorna a URL relativa (ex: "/uploads/uuid.png") pra ser usada como
// `imagemUrl` ao criar o chamado — upload e criação são duas chamadas
// separadas de propósito (ver CONTRATO.md).
export async function enviarImagem(token, arquivo) {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const resposta = await chamarApi('/uploads', { token, metodo: 'POST', corpo: formData, comoFormData: true })
  return resposta.url
}
