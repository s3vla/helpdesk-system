# Deploy no IIS + iisnode

Passo a passo pra você rodar no Gerenciador do IIS do servidor — nada
disso é automatizável daqui, precisa ser feito manualmente lá.

Pré-requisito: IIS, o módulo **iisnode** e o **URL Rewrite Module** já
instalados (confirmado que já estão). Node.js também precisa estar
instalado no servidor (o iisnode usa o `node.exe` do sistema).

---

## ⚠️ Passo mais importante — variáveis de ambiente no Application Pool

**Faça isso antes de testar o site.** É o passo mais fácil de esquecer, e
sem ele a API derruba na inicialização (`getOrThrow('DATABASE_URL')`
lança exceção) — porque o diretório de trabalho do processo Node sob o
iisnode não é garantidamente `backend/`, então `backend/.env` pode não
ser encontrado (ver explicação que já te dei antes de gerar o
`web.config`). Configurando aqui, a variável vira `process.env` pro Node
não importa o diretório de trabalho.

### Método recomendado — PowerShell (roda no servidor, como Administrador)

```powershell
Import-Module WebAdministration

$appPool = "NovatechHelpdeskPool"   # troque pelo nome real do seu pool

$variaveis = @{
  "DATABASE_URL"          = "postgresql://usuario:senha@host:5432/banco_producao"
  "JWT_SECRET"             = "<gere um valor aleatório longo, nunca reaproveite o de dev>"
  "JWT_EXPIRES_IN"         = "8h"
  "CORS_ORIGIN"            = "https://dominio-real-do-servidor"
  "APP_URL"                = "https://dominio-real-do-servidor"
  "HTTPS_ATIVO"            = "false"   # só "true" quando o certificado entrar
  "SEED_TECNICO_1_NOME"    = "Suporte TI"
  "SEED_TECNICO_1_EMAIL"   = "suporte@novatechagro.com.br"
  "SEED_TECNICO_1_SENHA"   = "<senha de bootstrap real, forte>"
  "SEED_TECNICO_2_NOME"    = "TI Novatech Agro"
  "SEED_TECNICO_2_EMAIL"   = "ti@novatechagro.com.br"
  "SEED_TECNICO_2_SENHA"   = "<senha de bootstrap real, forte>"
  "SMTP_HOST"              = "smtp.skymail.net.br"
  "SMTP_PORT"              = "587"
  "SMTP_USER"              = "webpedidos@novatechagro.com.br"
  "SMTP_PASS"              = "<senha real do SMTP>"
  "EMAIL_REMETENTE"        = "webpedidos@novatechagro.com.br"
  "DESABILITAR_ENVIO_EMAIL"= "false"   # false = e-mail real. Confirme que é ISSO que você quer antes de subir.
}

foreach ($chave in $variaveis.Keys) {
  Add-WebConfigurationProperty -PSPath "IIS:\AppPools\$appPool" `
    -Filter "environmentVariables" -Name "." `
    -Value @{ name = $chave; value = $variaveis[$chave] }
}

# Confirma o que ficou configurado (sem mostrar segredos na tela toda vez —
# rode isso só quando quiser conferir):
Get-WebConfigurationProperty -PSPath "IIS:\AppPools\$appPool" -Filter "environmentVariables" -Name "."
```

**NÃO adicione `PORT` nessa lista** — o iisnode injeta essa variável
sozinho, apontando pra um pipe nomeado interno, não uma porta TCP. Se
você setar `PORT` manualmente aqui, entra em conflito com o que o
iisnode precisa controlar.

### Alternativa — pela interface gráfica (IIS 10 versão 1709+ / Windows Server 2019+)

Se o seu IIS já tiver a seção gráfica (nem toda versão tem):

1. **Gerenciador do IIS** → **Application Pools** (painel esquerdo)
2. Clique no pool do site (crie um antes, se ainda não existir — ver
   próxima seção) → **Advanced Settings** (painel direito)
3. Procure **Environment Variables** → `...` (reticências) pra abrir o
   editor
4. Adicione cada par nome/valor da tabela acima, um por vez → **OK**

Se essa seção não aparecer no seu IIS, use o método PowerShell acima —
funciona em qualquer versão que já tenha o módulo `environmentVariables`
dos Application Pools (a maioria dos Windows Server em uso hoje).

---

## 1. Criar o Application Pool

1. **Gerenciador do IIS** → **Application Pools** → **Add Application Pool...**
2. Nome: algo como `NovatechHelpdeskPool`
3. **.NET CLR version**: **No Managed Code** (é Node, não .NET)
4. **Managed pipeline mode**: Integrated
5. **OK**
6. Configure as variáveis de ambiente nesse pool agora, se ainda não fez
   (seção acima)

## 2. Criar o site

1. **Gerenciador do IIS** → **Sites** → **Add Website...**
2. **Site name**: `Novatech Helpdesk` (ou o nome que preferir)
3. **Application pool**: selecione o pool criado no passo 1 (clique em
   **Select...** se não vier selecionado automaticamente)
4. **Physical path**: aponte pra pasta **`backend`** do projeto no
   servidor (a pasta que contém `web.config`, `dist/`, `.env` — não
   `backend/dist`, a pasta `backend` inteira)
5. **Binding**: escolha a porta que vai usar (ex: `80` se for a única
   coisa nesse IP, ou uma porta própria tipo `8080` se dividir o servidor
   com outros sites — combine com quem administra o servidor)
6. **OK**

## 3. Permissões de pasta

O usuário/identidade do Application Pool (por padrão
`IIS AppPool\NovatechHelpdeskPool`) precisa de:

- **Leitura** em toda a pasta `backend/` (e em `frontend/dist/`, já que o
  `ServeStaticModule` lê os arquivos do build do frontend de lá — ver
  `app.module.ts`, o caminho é relativo: `../../frontend/dist` a partir
  de `backend/dist`, então a pasta `frontend/` precisa estar no mesmo
  nível de `backend/` no servidor, exatamente como no repositório)
- **Escrita** em `backend/uploads/` (imagens anexadas aos chamados)
- **Escrita** em `backend/iisnode/` (logs — o iisnode cria essa pasta
  sozinho na primeira execução, só precisa ter permissão)

No Explorador de Arquivos: botão direito na pasta → **Propriedades** →
**Segurança** → **Editar** → **Adicionar** → digite
`IIS AppPool\NomeDoSeuPool` → dá permissão de Leitura (e Gravação nas
duas pastas específicas acima).

## 4. Build e migration antes do primeiro start

No servidor (ou copiando o resultado de uma build feita em outro lugar):

```powershell
cd caminho\pro\projeto\frontend
npm run build

cd ..\backend
npm run build

# Banco de produção vazio? Roda a migration ANTES de subir o site:
npm run migration:run:prod
```

(`migration:run:prod` já existe no `package.json` — roda contra o
`dist/data-source.js` compilado, sem precisar de `ts-node` no servidor.
Usa `DATABASE_URL` do ambiente — como você configurou isso no
Application Pool, funciona rodando via linha de comando comum também,
desde que a sessão do PowerShell tenha essa variável setada, ou passe
inline: `$env:DATABASE_URL = "..."; npm run migration:run:prod`.)

## 5. Testar

1. **Gerenciador do IIS** → selecione o site → **Start** (se não tiver
   iniciado sozinho)
2. Acesse a porta configurada no binding (ex: `http://ip-do-servidor:8080`)
3. Confirme: a tela de login carrega (não um erro do IIS), login
   funciona, abrir chamado com upload funciona

---

## Troubleshooting comum

- **Erro 500.1002 ou "não foi possível encontrar node.exe"**: o iisnode
  não achou o Node instalado. Adicione no `<iisnode>` do `web.config`:
  `nodeProcessCommandLine="&quot;C:\Program Files\nodejs\node.exe&quot;"`
  (ajuste pro caminho real de onde o Node está instalado nesse servidor).
- **Erro 502.3 / "forbidden"**: geralmente permissão de pasta (passo 3)
  ou a variável `DATABASE_URL` não chegou no processo — confira os logs
  em `backend/iisnode/` (um arquivo `.txt` por processo iniciado).
- **API sobe mas devolve HTML de erro genérico em vez de JSON**: confirme
  que o `<httpErrors existingResponse="PassThrough" />` está no
  `web.config` (já vem configurado — só reconfirme se alguém editou o
  arquivo depois).
- **Frontend carrega mas as chamadas de API falham**: confirme que
  `frontend/dist` existe no servidor (rodou `npm run build` no frontend
  também, não só no backend) e está na pasta certa (`frontend/` irmã de
  `backend/`, não dentro dela).
- **Precisa aplicar um novo deploy (build novo)**: rebuilda (`npm run
  build` nos dois lados), depois reinicie o site pelo Gerenciador do IIS
  (**Sites** → selecione o site → **Restart**) — o `web.config` está
  configurado pra só reiniciar o processo Node quando ele mesmo for
  tocado, não automaticamente a cada arquivo novo em `dist/`, então o
  restart manual é necessário depois de cada deploy.
