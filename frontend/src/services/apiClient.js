// Camada mais baixa de acesso à API: só sabe montar a requisição HTTP,
// anexar o token e transformar uma resposta de erro num objeto de erro
// previsível. Nenhuma regra de negócio mora aqui — quem decide "o que
// buscar e quando" é o ticketService e os componentes de tela.

const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Classe própria de erro (em vez de deixar o erro genérico do fetch
// vazar) para toda chamada de API poder verificar `erro.status` — é assim
// que o AuthContext reconhece um 401 e decide encerrar a sessão.
export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
  }
}

// `corpo` pode ser um objeto comum (vira JSON) ou um FormData (upload de
// arquivo) — nesse segundo caso não setamos Content-Type manualmente,
// porque é o próprio navegador quem precisa gerar o cabeçalho com o
// "boundary" correto do multipart.
export async function chamarApi(caminho, { token, metodo = 'GET', corpo, comoFormData = false } = {}) {
  let resposta
  try {
    resposta = await fetch(`${URL_BASE}/api${caminho}`, {
      method: metodo,
      headers: {
        ...(comoFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo === undefined ? undefined : comoFormData ? corpo : JSON.stringify(corpo),
    })
  } catch {
    // fetch só lança exceção em falha de REDE (servidor fora do ar, sem
    // internet, CORS bloqueado) — nunca por causa de um status de erro
    // HTTP. Usamos status 0 para diferenciar isso de um erro "normal" da
    // API, que sempre vem com um status real.
    throw new ErroApi(0, 'Não foi possível conectar ao servidor.')
  }

  // Lê como texto primeiro pra distinguir dois casos que `resposta.json()`
  // direto trata igual (os dois lançam a mesma exceção de parse), mas que
  // são bem diferentes na prática:
  // - corpo VAZIO de propósito (ex: DELETE sem retorno) — não é erro, `dados`
  //   fica `null` e segue o fluxo normal, como sempre foi;
  // - corpo NÃO vazio mas ilegível como JSON — resposta truncada/corrompida
  //   (ex: servidor reiniciando no meio da requisição em dev). Isso PRECISA
  //   virar um erro de verdade: se tratássemos igual ao caso vazio, quem
  //   chama receberia `null` como se fosse um dado válido — foi exatamente
  //   isso que causou tela branca no Dashboard (ver DashboardTI.jsx).
  const texto = await resposta.text()
  let dados = null
  if (texto) {
    try {
      dados = JSON.parse(texto)
    } catch {
      dados = undefined // sentinela: teve corpo, mas não deu pra entender
    }
  }

  if (!resposta.ok) {
    const mensagem = Array.isArray(dados?.message) ? dados.message[0] : (dados?.message ?? 'Ocorreu um erro inesperado.')
    throw new ErroApi(resposta.status, mensagem)
  }

  if (dados === undefined) {
    throw new ErroApi(resposta.status, 'Resposta inválida do servidor. Tente novamente.')
  }

  return dados
}

export { URL_BASE }
