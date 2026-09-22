# Contrato da API — Help Desk Empresa Exemplo

Documento pra quem está no frontend integrar sem precisar ler o código do
backend. Toda rota (exceto `/auth/*`) exige o cabeçalho:

```
Authorization: Bearer <accessToken>
```

O token é devolvido por `/auth/login`, `/auth/primeiro-acesso` ou
`/auth/minha-senha` e expira em 8h (configurável via `JWT_EXPIRES_IN`).
**Toda requisição autenticada reconsulta o usuário no banco** (não é um JWT
puramente stateless) — um token deixa de funcionar imediatamente, mesmo
ainda dentro do prazo de expiração, se: a conta foi resetada
(`PATCH /usuarios/:id/resetar`), deixou de existir, ou a senha foi trocada
depois que aquele token específico foi emitido (`PATCH /auth/minha-senha`).
Isso fecha a brecha de alguém com sessão aberta (em outra aba/dispositivo)
continuar acessando o sistema depois da conta ser resetada ou da senha
mudar.

## Erros — formato padrão

Qualquer rota pode devolver isso em caso de erro (formato padrão do NestJS):

```json
{ "statusCode": 400, "message": "descrição do erro (ou array de mensagens de validação)", "error": "Bad Request" }
```

Códigos usados neste contrato: `400` (corpo/query inválido), `401` (sem
token ou token inválido/expirado), `403` (autenticado mas sem permissão —
inclui os casos de IDOR: acessar chamado/comentário de outra pessoa), `404`
(id não existe), `409` (e-mail já cadastrado), `429` (rate limit).

---

## Autenticação

### `POST /auth/login`
Sem token. Rate limit: **5 tentativas por minuto por IP** (429 se estourar).

Request:
```json
{ "email": "maria.souza@empresa-exemplo.com", "senha": "ExemploSenha@123" }
```

Response `200`:
```json
{
  "accessToken": "eyJhbGciOi...",
  "usuario": { "id": 1, "nome": "Maria Souza", "email": "maria.souza@empresa-exemplo.com", "cargo": "Analista Agrônoma", "departamento": "Campo", "tipo": "COLABORADOR", "emAguardoDeCadastro": false, "deveTrocarSenha": false }
}
```

`401` se e-mail não existir ou senha errada (mensagem genérica, não diz qual dos dois).

**`deveTrocarSenha: true`** só acontece com os 2 técnicos criados por seed
(`suporte@`/`ti@empresa-exemplo.com`), até a primeira vez que trocarem a
senha via `PATCH /auth/minha-senha` — nunca acontece com colaborador. O
frontend deve **bloquear o acesso normal ao Painel TI** enquanto isso for
`true`, forçando a troca de senha primeiro (a senha do `.env` é só de
bootstrap, não deveria virar a senha real de uso).

### `POST /auth/primeiro-acesso`
Sem token. Cria um usuário **COLABORADOR** novo e já devolve token logado
(mesmo formato de resposta do login).

**Lista fechada**: só e-mails presentes em `EMAILS_COLABORADOR_AUTORIZADOS`
(`src/config/emails-autorizados.ts`) podem completar o cadastro — mesmo
terminando em `@empresa-exemplo.com`. `403` com mensagem
`"Este e-mail não está autorizado a acessar o sistema. Entre em contato com o TI."`
para qualquer outro e-mail. `409` se o e-mail já tiver conta (mesmo estando
autorizado) — nesse caso o frontend deve orientar a fazer login.

Request:
```json
{
  "email": "rh@empresa-exemplo.com",
  "senha": "ExemploSenha@123",
  "nome": "Nome de quem está assumindo o cargo",
  "departamento": "Recursos Humanos"
}
```
> `departamento` é opcional — se não vier, o backend usa `"Empresa Exemplo"` como padrão.
> `cargo` também é aceito no corpo (opcional, string), mas a tela de Primeiro Acesso não coleta mais esse campo — fica `null` para contas novas.

Não existe rota de cadastro de técnico — técnicos são provisionados por
seed no backend, também restrito à lista fechada
(`EMAILS_TECNICO_AUTORIZADOS`, hoje só `suporte@` e `ti@empresa-exemplo.com`).
Um e-mail de colaborador nunca loga como técnico, mesmo que a senha esteja
certa — o `tipo` da conta é definido na criação e não muda sozinho.

### `PATCH /auth/minha-senha`
**Requer token** (única rota de `/auth/*` protegida). Troca a senha de quem
está autenticado — não existe parâmetro de "qual usuário", é sempre a
própria conta do token. Rate limit: **5 tentativas por minuto por IP**
(mesmo limite do login — essa rota pede "senha atual" como confirmação, é
alvo de força bruta se um token vazar).

Request:
```json
{ "senhaAtual": "SenhaAtual@123", "novaSenha": "NovaSenha@456", "confirmarNovaSenha": "NovaSenha@456" }
```
`401` se `senhaAtual` não bater com a senha de verdade (mensagem específica
"Senha atual incorreta" — sem risco de enumeração aqui, quem chama já
provou ser dono da conta). `400` se `novaSenha` ≠ `confirmarNovaSenha` ou
`novaSenha` tiver menos de 8 caracteres.

Response `200`: mesmo formato de `/auth/login` — **novo** `accessToken` e
`usuario` atualizado (`deveTrocarSenha` já vem `false`). **Importante:
troque o token guardado no frontend por este novo** — o token antigo (de
antes da troca) para de funcionar imediatamente, mesmo que ainda esteja
dentro do prazo de expiração.

**Bloqueio de verdade, não só de tela**: enquanto `usuario.deveTrocarSenha`
for `true` (só acontece com os 2 técnicos de seed, antes da primeira
troca), o backend recusa com **`403`** qualquer rota autenticada que não
seja esta — a única exceção é `PATCH /auth/minha-senha` em si. Não é uma
convenção que o frontend precisa respeitar por conta própria: mesmo
chamando a API direto (curl, Postman, sem passar pela tela nenhuma), o
token de um técnico nessa situação só serve pra trocar a senha, nada mais.

---

## Chamados

Objeto `Chamado` retornado por todas as rotas abaixo:
```json
{
  "id": 12,
  "titulo": "Wifi caindo",
  "descricao": "O wifi do galpão cai toda hora...",
  "mensagemErro": null,
  "categoria": "REDE",
  "prioridade": "ALTA",
  "nivel": "N2",
  "status": "ANDAMENTO",
  "aguardandoRespostaDe": "TECNICO",
  "imagemUrl": "/uploads/3f2c1e0a-....png",
  "anydeskId": "123 456 789",
  "dataAbertura": "2026-08-19T17:23:16.000Z",
  "dataAtualizacao": "2026-08-19T17:24:02.000Z",
  "solicitante": { "id": 1, "nome": "...", "email": "...", "cargo": "...", "departamento": "...", "tipo": "COLABORADOR" },
  "tecnicoResponsavel": { "id": 2, "nome": "Maria TI", "...": "..." },
  "abertoPorTecnico": null,
  "solucao": null,
  "observadores": [{ "id": 5, "nome": "Carlos Ribeiro", "email": "faturamento02@empresa-exemplo.com" }]
}
```
`tecnicoResponsavel` é `null` até um técnico iniciar atendimento. `imagemUrl` é `null` se não houve upload — quando existe, é um caminho relativo (`/uploads/...`); monte a URL completa como `API_BASE_URL + imagemUrl`. `anydeskId` é `null` se o colaborador não informou — texto livre, sem validação de formato (pode vir com espaços/traços). Visível pra colaborador e técnico igual, sem diferença — só a UI do técnico decide mostrar um botão de conectar em cima desse dado, isso não é responsabilidade do backend. `solucao` é `null` até o chamado ser finalizado; a partir daí vem `{ comoFoiResolvido, marcadaComo, dataCriacao }` **mesmo que `marcadaComo` seja `false`** — é o único lugar que expõe o texto da resolução para um chamado finalizado que não virou solução catalogada. `observadores` é sempre um array (nunca `null`), vazio quando ninguém foi adicionado como "Cc" — ver seção Observadores ("Cc") abaixo.

Enums: `categoria` = `HARDWARE | SOFTWARE | REDE | ACESSO | OUTRO` · `prioridade` = `BAIXA | MEDIA | ALTA` · `nivel` = `N1 | N2 | N3` · `status` = `PARADO | ANDAMENTO | FINALIZADO`.

`aguardandoRespostaDe` (`TECNICO | COLABORADOR | null`) indica de quem é a vez de responder — só tem significado com `status: "ANDAMENTO"`; é sempre `null` em `PARADO`/`FINALIZADO`. Atualizado automaticamente: ao iniciar atendimento (`PATCH /chamados/:id/status` com `"ANDAMENTO"`, vindo de `PARADO`) começa em `"TECNICO"` (o colaborador só descreveu o problema ao abrir, cabe ao técnico responder primeiro); a cada comentário **não-interno** em `POST /chamados/:id/comentarios`, vira o lado oposto de quem comentou (técnico comenta → vira `"COLABORADOR"`; colaborador ou observador comenta → vira `"TECNICO"`); comentário interno nunca altera esse campo (colaborador nunca vê esse comentário, não faz sentido ele "aguardar resposta" de algo que não existe pra ele); qualquer troca de status para algo diferente de `"ANDAMENTO"` (pausar, finalizar, reabrir) zera pra `null`.

`abertoPorTecnico` é um campo de AUDITORIA, não de posse — `null` no fluxo normal (`POST /chamados`, o próprio colaborador abrindo); preenchido só quando o chamado foi criado por um técnico em nome do colaborador (`POST /chamados/tecnico`, ver abaixo), com os dados do técnico que criou. `solicitante` continua sendo o dono real do chamado nos dois casos — é ele quem vê o chamado em `GET /chamados/meus`, não o técnico.

### `GET /chamados` — **só TECNICO** (403 para colaborador)
Query opcional: `?status=PARADO&nivel=N1&categoria=HARDWARE` (todos opcionais, combináveis).
Response `200`: `Chamado[]`, mais recentes primeiro.

### `GET /chamados/meus`
Chamados do usuário do token (colaborador ou técnico, cada um vê os que abriu). **Só solicitante** — chamados onde o usuário é observador ("Cc") não entram aqui, mesmo que ele tenha acesso a eles (ver `GET /chamados/observando`). Response `200`: `Chamado[]`.

### `GET /chamados/observando`
Chamados onde o usuário do token é observador ("Cc"), **não** solicitante — lista sempre separada de `/chamados/meus`, mesmo que o mesmo usuário apareça nas duas pra chamados diferentes. Response `200`: `Chamado[]`.

### `GET /chamados/:id`
Response `200`: `Chamado`. `403` se for colaborador tentando ver chamado que não é dele e que ele também não está observando. `404` se não existir.

### `POST /chamados` — **só COLABORADOR**
Request:
```json
{
  "titulo": "Wifi caindo",
  "descricao": "O wifi do galpão cai toda hora, os tablets desconectam",
  "mensagemErro": "opcional",
  "categoria": "REDE",
  "prioridade": "ALTA",
  "imagemUrl": "/uploads/3f2c1e0a-....png",
  "anydeskId": "123 456 789"
}
```
`imagemUrl` é opcional e vem do retorno de `POST /uploads` (ver seção Uploads) — esta rota nunca recebe o arquivo em si, só a URL de um upload já feito. `anydeskId` é opcional, texto livre (sem `@Matches`/formato fixo — o ID do AnyDesk varia de como a pessoa copiou da tela do programa). `status` sempre começa `PARADO`; `solicitante` é sempre quem está no token. Response `201`: `Chamado`.

### `POST /chamados/tecnico` — **só TECNICO**
Técnico abre um chamado em nome de um colaborador — cenário "colega ligou/pediu pessoalmente, sem passar pelo formulário ele mesmo". Mesmo corpo de `POST /chamados` acima, mais `solicitanteId`:
```json
{
  "solicitanteId": 7,
  "titulo": "Wifi caindo",
  "descricao": "O wifi do galpão cai toda hora, os tablets desconectam",
  "categoria": "REDE",
  "prioridade": "ALTA"
}
```
`400` se `solicitanteId` não corresponder a um usuário `COLABORADOR` com conta ativa (mesma checagem de "colaborador ativo" que `POST /chamados/:id/observadores` já faz — conta resetada/aguardando Primeiro Acesso não serve). O colaborador informado vira o `solicitante` real do chamado (mesmíssimo efeito de `GET /chamados/meus` dele que se tivesse aberto sozinho); `abertoPorTecnico` é preenchido com o técnico do token — nunca vem do corpo da requisição. `nivel`/`status` seguem exatamente a mesma regra do `POST /chamados` normal. Response `201`: `Chamado`.

`nivel` é sugerido pelo backend (`src/chamados/nivel-triagem.util.ts`), nesta ordem de precedência (a primeira que bater define o nível):
1. Descrição ou mensagem de erro menciona "viasoft" (cobre "via soft", "viasoft erp") → `N3`
2. Descrição ou mensagem de erro menciona infraestrutura crítica — "servidor", "banco de dados", "backup", "firewall", "dominio"/"domínio" (acento ou não, case-insensitive) → `N3`
3. Categoria = `REDE` → `N2`
4. Qualquer outro caso → `N1`

Sem IA — busca simples de termo, mesma lógica de `palavras-chave.util.ts`. **Nível é só uma etiqueta de organização/filtro** — nunca controle de acesso: os dois técnicos sempre veem e podem assumir qualquer chamado, seja qual for o nível.

### `PATCH /chamados/:id/status` — **só TECNICO**
Request para pausar/reabrir:
```json
{ "status": "PARADO" }
```
Request para iniciar atendimento:
```json
{ "status": "ANDAMENTO" }
```
`403` se outro técnico já for o responsável.

Request para finalizar (**`comoFoiResolvido` obrigatório** — `400` sem ele):
```json
{ "status": "FINALIZADO", "comoFoiResolvido": "Reconectamos o cabo do roteador", "marcadaComo": true, "imagemUrlSolucao": "/uploads/9f1a2b3c-....png" }
```
`marcadaComo: true` cria/expõe a solução em `GET /solucoes-conhecidas`. `imagemUrlSolucao` é opcional — mesmo fluxo de duas etapas do upload do chamado: sobe o arquivo em `POST /uploads` primeiro, manda a URL aqui depois. Response `200`: `Chamado` atualizado.

### `GET /chamados/:id/solucoes-sugeridas` — **só TECNICO**
Sugestões automáticas de soluções parecidas, pra usar no painel de atendimento de um chamado ainda não finalizado. Busca soluções conhecidas (`marcadaComo: true`) da **mesma categoria** do chamado e compara palavras-chave da descrição — sem IA, só contagem de termos em comum (ver `src/solucoes-conhecidas/palavras-chave.util.ts`). Sem correspondência nenhuma → `200` com array vazio (não é erro).

Response `200`:
```json
[
  { "chamadoId": 12, "resumo": "Impressora HP offline", "comoFoiResolvido": "Reinstalamos o driver da impressora", "ocorrenciasCategoria": 5 }
]
```
No máximo 3 itens, ordenados pela quantidade de palavras em comum (mais parecido primeiro).

### `PATCH /chamados/:id/nivel` — **só TECNICO**
Reclassificação manual do nível, pros casos em que a regra automática (acima) erra.
```json
{ "nivel": "N3" }
```
Se o valor for igual ao atual, não faz nada (idempotente, sem gerar comentário). Se mudar, grava um **comentário interno automático** no chamado — `"Nível ajustado de N1 para N3"`, com `tipo: "NIVEL_AJUSTADO"` (em vez do padrão `"COMENTARIO"`) e o técnico que fez a mudança como autor — servindo de histórico pra perceber, com o tempo, se a regra automática está errando muito. Response `200`: `Chamado` atualizado.

### `POST /chamados/:id/observadores` — **só TECNICO**
Adiciona um colaborador como observador ("Cc") — ele passa a ter acesso de leitura/comentário ao chamado, sem virar o solicitante.
```json
{ "usuarioId": 5 }
```
`400` se `usuarioId` não for um colaborador com conta ativa (contas resetadas — `emAguardoDeCadastro: true` — não podem ser adicionadas), ou se for o próprio solicitante do chamado. `409` se esse colaborador já estiver observando. `404` se o chamado não existir. Response `200`: `Chamado` atualizado (com o novo observador em `observadores`).

### `DELETE /chamados/:id/observadores/:usuarioId` — **só TECNICO**
Remove um observador. `404` se esse colaborador não estava observando este chamado. Response `200`: `Chamado` atualizado.

**Envio de e-mail:** o desenho da funcionalidade prevê notificar por e-mail quando alguém é adicionado como observador, e incluir os observadores em toda notificação que hoje vai pro solicitante (mudança de status, comentário não-interno) — mas **não existe infraestrutura de e-mail no projeto ainda** (decisão explícita: implementar o resto da funcionalidade e deixar o envio de fora até isso existir). Os pontos de extensão estão marcados com `TODO` no código (`ObservadoresService.adicionar` e — quando notificações de status/comentário forem implementadas — `ChamadosService.atualizarStatus` / `ComentariosService.criar`).

---

## Comentários (aninhados em chamados)

Objeto `Comentario`:
```json
{ "id": 5, "texto": "Verificando...", "interno": false, "imagemUrl": null, "dataCriacao": "2026-08-19T17:24:02.000Z", "autor": { "id": 2, "nome": "Maria TI", "...": "..." }, "ehObservador": false, "tipo": "COMENTARIO" }
```
`ehObservador` é `true` quando o `autor` era um observador ("Cc") do chamado NO MOMENTO em que comentou — nunca o solicitante original nem um técnico. É calculado uma vez, na criação (não recalculado depois): se esse observador for removido mais tarde, o comentário antigo continua marcando corretamente que ele era observador quando escreveu. Frontend usa isso pra mostrar um rótulo "Cc" no histórico, evitando confusão sobre quem é o dono do chamado.

`tipo` é `"COMENTARIO"` (padrão, escrito por alguém) ou `"NIVEL_AJUSTADO"` (entrada automática de auditoria gerada por `PATCH /chamados/:id/nivel`, ver seção Chamados). Frontend usa isso pra mostrar o histórico de reclassificação de nível separado da conversa de verdade.

### `POST /chamados/:id/comentarios`
Colaborador e técnico podem comentar — isso inclui observadores ("Cc"), que têm o mesmo acesso de comentário que o solicitante. `interno: true` só tem efeito se quem posta é TECNICO (colaborador ou observador que mandar `interno: true` é ignorado, vira `false` silenciosamente). `403` se quem está comentando não for nem o solicitante nem um observador do chamado, **ou se o chamado estiver com `status: "FINALIZADO"`** (precisa reabrir primeiro — `PATCH /chamados/:id/status` com `"PARADO"` — antes de comentar de novo).

Request:
```json
{ "texto": "Já tentei reiniciar e continua sem sinal", "interno": false, "imagemUrl": "/uploads/9f1a2b3c-....png" }
```
`imagemUrl` é opcional — mesmo fluxo de duas etapas dos outros uploads: `POST /uploads` primeiro, manda a URL aqui depois. Se `interno: true`, a imagem some pro colaborador junto com o resto do comentário (mesma checagem de `GET /chamados/:id/comentarios` abaixo, nada específico pra imagem). Response `201`: `Comentario`.

### `GET /chamados/:id/comentarios`
Response `200`: `Comentario[]`, mais antigo primeiro. **Colaborador (solicitante ou observador) nunca recebe comentários com `interno: true`** — o backend já filtra antes de responder. `403` se quem pede não for o solicitante nem um observador do chamado.

---

## Uploads

### `POST /uploads`
Autenticado (qualquer tipo). Corpo é `multipart/form-data`, não JSON — um único campo de arquivo chamado **`arquivo`**. Aceita apenas `image/png`, `image/jpeg`, `image/webp`; limite de 5MB. `400` se o tipo não for aceito ou nenhum arquivo vier.

Response `201`:
```json
{ "url": "/uploads/3f2c1e0a-91d2-4b7e-9c3a-7f8e6d5c4b3a.png" }
```
Use essa `url` como valor de `imagemUrl` ao criar o chamado (`POST /chamados`) — são duas chamadas separadas: primeiro sobe o arquivo, depois cria o chamado com a URL recebida. Os arquivos ficam publicamente acessíveis em `API_BASE_URL + url` (servidos como arquivo estático, sem exigir token — só a rota de upload em si exige).

---

## Usuários — **todas as rotas só TECNICO**

Objeto `UsuarioResponseDto`:
```json
{ "id": 3, "nome": "Fernanda Alves", "email": "faturamento02@empresa-exemplo.com", "cargo": "Assistente Administrativo", "departamento": "Empresa Exemplo", "tipo": "COLABORADOR", "emAguardoDeCadastro": false, "deveTrocarSenha": false }
```
`nome`/`cargo` vêm `null` e `emAguardoDeCadastro: true` quando a conta foi resetada (ver `PATCH /usuarios/:id/resetar`) e ainda ninguém completou o Primeiro Acesso de novo naquele e-mail.

### `GET /usuarios`
Lista só usuários `tipo: COLABORADOR` (é a tela "Colaboradores" do painel de TI — técnicos não aparecem aqui), **incluindo os que estão em `emAguardoDeCadastro: true`** — é assim que um técnico enxerga "este e-mail foi resetado e está esperando alguém". Response `200`: `UsuarioResponseDto[]` (sem `senhaHash`, claro).

### `GET /usuarios/:id/chamados`
Todos os chamados abertos por aquele colaborador. Response `200`: `Chamado[]`.

### `PATCH /usuarios/:id/resetar`
Sem corpo. Apaga `nome`, `cargo` e a senha da conta (`emAguardoDeCadastro` vira `true`) — usado quando um e-mail de cargo (ex: `faturamento02@empresa-exemplo.com`) muda de responsável. `400` se `:id` não for de uma conta `COLABORADOR` (técnicos não passam por este fluxo). Response `200`: `UsuarioResponseDto` atualizado.

**Importante para o frontend:**
- Depois do reset, a senha antiga **para de funcionar imediatamente** (login retorna `401` genérico, igual a qualquer credencial errada).
- O e-mail resetado volta a aceitar `POST /auth/primeiro-acesso` — a conta nova reaproveita o **mesmo `id`** (não cria um usuário novo), então todo o histórico de chamados daquele e-mail continua acessível e vinculado à conta.
- **Efeito colateral que a UI precisa saber**: como é o mesmo `id` reaproveitado, chamados antigos (abertos por quem tinha o e-mail antes) passam a exibir o **novo** nome como `solicitante` depois que a nova pessoa completa o cadastro — não existe "nome de quem abriu na época" separado do "nome atual do dono do e-mail".

---

## Soluções Conhecidas

### `GET /solucoes-conhecidas`
Query opcional: `?busca=impressora&categoria=HARDWARE` (busca é case-insensitive, procura no título do chamado, no texto da resolução e na categoria).

Só retorna soluções com `marcadaComo: true` — chamados finalizados sem essa marcação não aparecem aqui.

Response `200`:
```json
[
  {
    "id": 3,
    "chamadoId": 12,
    "tituloChamado": "Wifi caindo",
    "descricaoChamado": "O wifi do galpão cai toda hora...",
    "categoria": "REDE",
    "comoFoiResolvido": "Reconectamos o cabo do roteador",
    "marcadaComo": true,
    "imagemUrl": "/uploads/9f1a2b3c-....png",
    "dataCriacao": "2026-08-19T17:25:00.000Z",
    "resolvidoPor": { "id": 2, "nome": "Maria TI", "...": "..." },
    "ocorrenciasCategoria": 4
  }
]
```
`ocorrenciasCategoria` = quantos chamados (de qualquer status, não só os com solução) já existem naquela categoria — é o "quão recorrente é esse problema", não "quantas soluções catalogadas". `imagemUrl` é `null` se a resolução não teve print anexado — mesmo formato do `imagemUrl` do chamado (caminho relativo, monte a URL completa como `API_BASE_URL + imagemUrl`).

---

## Coisas que o frontend precisa saber pra integrar

1. **`FirstAccessModal.jsx` precisa ganhar um campo de senha** — o backend exige `senha` em `/auth/primeiro-acesso`, o formulário atual não coleta isso.
2. **Guardar o `accessToken` só em memória (estado do React)** — nunca em `localStorage`/`sessionStorage`. Não existe sessão via cookie.
3. **CORS só libera as origens definidas em `CORS_ORIGIN`** no `.env` do backend — em dev já vem configurado pra `http://localhost:5173` (a porta padrão do Vite deste projeto).
4. **Nenhuma rota aceita campo fora do DTO documentado aqui** — o backend rejeita com `400` (`whitelist` + `forbidNonWhitelisted` do ValidationPipe). Se o front mandar um campo a mais "pra garantir", a requisição inteira falha.
5. **Todos os enums do backend são MAIÚSCULOS** (`PARADO`, `BAIXA`, `HARDWARE`...) — se o frontend usa valores diferentes internamente (minúsculo, capitalizado), a tradução entre os dois formatos precisa acontecer na camada de serviço, não nos componentes de tela.
