// Camada de acesso a dados — agora conversando de verdade com a API
// (novatech-helpdesk-api), documentada em CONTRATO.md. Cada função aqui é a
// mesma que existia quando os dados eram mockados; só o corpo mudou (de
// "retorna array fixo" para "chama a API"), então nenhum componente de tela
// precisou saber que essa troca aconteceu.
//
// Duas responsabilidades extras que só fazem sentido aqui, na fronteira com
// a API:
// 1. Tradução de enum: a API usa maiúsculas (PARADO, BAIXA, HARDWARE...);
//    o resto do app usa os valores em minúsculo/capitalizado que já
//    existiam desde o protótipo (mantidos para não precisar reescrever
//    StatusBadge, PriorityChip, os filtros de cada tela etc.).
// 2. Tradução de formato: a API responde em português (titulo, descricao,
//    solicitante...); os componentes esperam os nomes em inglês herdados do
//    protótipo original (summary, description, userId...). mapearChamado
//    faz essa ponte numa única função, testável e fácil de achar.

import { chamarApi } from './apiClient'

const STATUS_PARA_API = { parado: 'PARADO', andamento: 'ANDAMENTO', finalizado: 'FINALIZADO' }
const STATUS_DA_API = { PARADO: 'parado', ANDAMENTO: 'andamento', FINALIZADO: 'finalizado' }
const PRIORIDADE_PARA_API = { baixa: 'BAIXA', media: 'MEDIA', alta: 'ALTA' }
const CATEGORIA_PARA_API = { Hardware: 'HARDWARE', Software: 'SOFTWARE', Rede: 'REDE', Acesso: 'ACESSO', Outro: 'OUTRO' }
const CATEGORIA_DA_API = { HARDWARE: 'Hardware', SOFTWARE: 'Software', REDE: 'Rede', ACESSO: 'Acesso', OUTRO: 'Outro' }

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
    category: CATEGORIA_DA_API[c.categoria],
    created: new Date(c.dataAbertura),
    updated: new Date(c.dataAtualizacao),
    assignedTo: c.tecnicoResponsavel?.nome,
    // Auditoria: só existe quando um TÉCNICO abriu este chamado em nome do
    // colaborador (POST /chamados/tecnico) — null no fluxo normal. Nunca
    // é o "dono" do chamado, isso continua sendo `userId`/`solicitanteNome`
    // acima; ver TicketPanel (indicação "Aberto por ..." só pro lado TI).
    abertoPorTecnicoNome: c.abertoPorTecnico?.nome,
    hasImage: !!c.imagemUrl,
    imagemUrl: c.imagemUrl,
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
    id: String(c.id), author: c.autor.nome, text: c.texto, date: new Date(c.dataCriacao),
    internal: c.interno, imagemUrl: c.imagemUrl, isObserver: c.ehObservador,
    // NIVEL_AJUSTADO é a entrada automática de auditoria gerada ao
    // reclassificar o nível (ver PATCH /chamados/:id/nivel) — o painel usa
    // isso pra mostrar esse histórico separado da conversa de verdade, em
    // vez de misturado nela.
    isLevelChange: c.tipo === 'NIVEL_AJUSTADO',
  }
}

function mapearSolucao(s) {
  return {
    id: String(s.chamadoId),
    category: CATEGORIA_DA_API[s.categoria],
    summary: s.tituloChamado,
    description: s.descricaoChamado,
    ocorrenciasCategoria: s.ocorrenciasCategoria,
    resolution: {
      text: s.comoFoiResolvido,
      isKnownSolution: s.marcadaComo,
      resolvedAt: new Date(s.dataCriacao),
      resolvedBy: s.resolvidoPor?.nome,
      hasImage: !!s.imagemUrl,
      imagemUrl: s.imagemUrl,
    },
  }
}

// ── Chamados ─────────────────────────────────────────────────────────────

export async function buscarMeusChamados(token) {
  const chamados = await chamarApi('/chamados/meus', { token })
  return chamados.map(mapearChamado)
}

// Chamados onde o usuário do token é observador ("Cc") — lista separada
// de "meus chamados" mesmo que o mesmo usuário apareça nas duas, pra
// chamados diferentes (ver CONTRATO.md).
export async function buscarChamadosObservando(token) {
  const chamados = await chamarApi('/chamados/observando', { token })
  return chamados.map(mapearChamado)
}

export async function buscarChamadosTI(token, filtros = {}) {
  const params = new URLSearchParams()
  if (filtros.status && filtros.status !== 'all') params.set('status', STATUS_PARA_API[filtros.status])
  if (filtros.nivel && filtros.nivel !== 'all') params.set('nivel', filtros.nivel)
  if (filtros.categoria && filtros.categoria !== 'all') params.set('categoria', CATEGORIA_PARA_API[filtros.categoria])
  const query = params.toString()
  const chamados = await chamarApi(`/chamados${query ? `?${query}` : ''}`, { token })
  return chamados.map(mapearChamado)
}

export async function buscarChamado(token, chamadoId) {
  const chamado = await chamarApi(`/chamados/${chamadoId}`, { token })
  return mapearChamado(chamado)
}

// Deriva o título a partir dos primeiros caracteres da descrição — o
// formulário de abertura de chamado nunca teve um campo de título separado,
// então mantemos esse mesmo comportamento do protótipo original.
export async function criarChamado(token, { descricao, mensagemErro, categoria, prioridade, imagemUrl, anydeskId }) {
  const chamado = await chamarApi('/chamados', {
    token,
    metodo: 'POST',
    corpo: {
      titulo: descricao.slice(0, 65),
      descricao,
      mensagemErro: mensagemErro || undefined,
      categoria: CATEGORIA_PARA_API[categoria],
      prioridade: PRIORIDADE_PARA_API[prioridade],
      imagemUrl: imagemUrl || undefined,
      anydeskId: anydeskId || undefined,
    },
  })
  return mapearChamado(chamado)
}

// Técnico abre um chamado em nome de um colaborador (cenário "colega
// ligou/pediu pessoalmente") — mesmo corpo de criarChamado() acima, mais
// `solicitanteId`. Ainda deriva o título a partir da descrição, mesma
// regra do formulário do colaborador (nunca existiu campo de título
// separado em nenhum dos dois fluxos).
export async function abrirChamadoComoTecnico(token, { solicitanteId, descricao, mensagemErro, categoria, prioridade, imagemUrl, anydeskId }) {
  const chamado = await chamarApi('/chamados/tecnico', {
    token,
    metodo: 'POST',
    corpo: {
      solicitanteId: Number(solicitanteId),
      titulo: descricao.slice(0, 65),
      descricao,
      mensagemErro: mensagemErro || undefined,
      categoria: CATEGORIA_PARA_API[categoria],
      prioridade: PRIORIDADE_PARA_API[prioridade],
      imagemUrl: imagemUrl || undefined,
      anydeskId: anydeskId || undefined,
    },
  })
  return mapearChamado(chamado)
}

export async function atualizarStatusChamado(token, chamadoId, { status, comoFoiResolvido, marcadaComo, imagemUrlSolucao }) {
  const chamado = await chamarApi(`/chamados/${chamadoId}/status`, {
    token,
    metodo: 'PATCH',
    corpo: {
      status: STATUS_PARA_API[status],
      ...(comoFoiResolvido !== undefined ? { comoFoiResolvido } : {}),
      ...(marcadaComo !== undefined ? { marcadaComo } : {}),
      ...(imagemUrlSolucao ? { imagemUrlSolucao } : {}),
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

// ── Comentários ──────────────────────────────────────────────────────────

export async function buscarComentarios(token, chamadoId) {
  const comentarios = await chamarApi(`/chamados/${chamadoId}/comentarios`, { token })
  return comentarios.map(mapearComentario)
}

export async function criarComentario(token, chamadoId, { texto, interno, imagemUrl }) {
  const comentario = await chamarApi(`/chamados/${chamadoId}/comentarios`, {
    token,
    metodo: 'POST',
    corpo: { texto, interno, ...(imagemUrl ? { imagemUrl } : {}) },
  })
  return mapearComentario(comentario)
}

// ── Colaboradores (painel de TI) ────────────────────────────────────────

export async function buscarColaboradores(token) {
  const usuarios = await chamarApi('/usuarios', { token })
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

// ── Soluções conhecidas ──────────────────────────────────────────────────

export async function buscarSolucoesConhecidas(token) {
  const solucoes = await chamarApi('/solucoes-conhecidas', { token })
  return solucoes.map(mapearSolucao)
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
