# Deploy no Windows Server via NSSM

Este é o processo real usado hoje em produção. Substituiu o deploy via
IIS + iisnode (ver [`DEPLOY-IIS.md`](./DEPLOY-IIS.md), mantido só como
histórico) por causa de um erro 502.3/permissão no iisnode que nunca foi
resolvido — o NSSM roda o backend como um serviço Windows comum,
executando `node dist/main.js` diretamente, sem o iisnode no meio.

Pré-requisito: [NSSM](https://nssm.cc/) e Node.js já instalados no
servidor, e o serviço já criado (ver seção 1 se ainda não existir).

---

## 1. Criar o serviço (só na primeira vez)

No servidor, como Administrador:

```powershell
cd caminho\pro\projeto\backend
nssm install NovatechHelpdesk "C:\Program Files\nodejs\node.exe" "dist\main.js"
nssm set NovatechHelpdesk AppDirectory "caminho\pro\projeto\backend"
```

## 2. ⚠️ Variáveis de ambiente — configurar antes do primeiro start

Igual ao que era feito no Application Pool do IIS, mas agora no próprio
serviço NSSM. Sem isso a API derruba na inicialização
(`getOrThrow('DATABASE_URL')` lança exceção).

```powershell
nssm set NovatechHelpdesk AppEnvironmentExtra `
  DATABASE_URL=postgresql://usuario:senha@host:5432/banco_producao `
  JWT_SECRET=<gere um valor aleatório longo, nunca reaproveite o de dev> `
  JWT_EXPIRES_IN=8h `
  CORS_ORIGIN=https://dominio-real-do-servidor `
  APP_URL=https://dominio-real-do-servidor `
  HTTPS_ATIVO=false `
  PORT=3000 `
  SEED_TECNICO_1_NOME="Suporte TI" `
  SEED_TECNICO_1_EMAIL=suporte@novatechagro.com.br `
  SEED_TECNICO_1_SENHA=<senha de bootstrap real, forte> `
  SEED_TECNICO_2_NOME="TI Novatech Agro" `
  SEED_TECNICO_2_EMAIL=ti@novatechagro.com.br `
  SEED_TECNICO_2_SENHA=<senha de bootstrap real, forte> `
  SMTP_HOST=smtp.skymail.net.br `
  SMTP_PORT=587 `
  SMTP_USER=webpedidos@novatechagro.com.br `
  SMTP_PASS=<senha real do SMTP> `
  EMAIL_REMETENTE=webpedidos@novatechagro.com.br `
  DESABILITAR_ENVIO_EMAIL=false
```

(Diferente do iisnode, aqui `PORT` precisa ser setada explicitamente —
não tem injeção automática de pipe nomeado, é uma porta TCP real que o
`node dist/main.js` escuta direto.)

Confirme o que ficou salvo (sem mostrar segredo na tela toda vez, só
quando quiser conferir):

```powershell
nssm get NovatechHelpdesk AppEnvironmentExtra
```

Ou pela interface gráfica: `nssm edit NovatechHelpdesk` → aba
**Environment** → um par `CHAVE=valor` por linha.

## 3. Build e migration antes do primeiro start

```powershell
cd caminho\pro\projeto\frontend
npm run build

cd ..\backend
npm run build

# Banco de produção vazio? Roda a migration ANTES de subir o serviço:
npm run migration:run:prod
```

## 4. Iniciar o serviço

```powershell
nssm start NovatechHelpdesk
```

Confirme: `http://ip-ou-dominio-do-servidor:3000` carrega a tela de
login, login funciona, abrir chamado com upload funciona.

---

## 5. Fluxo normal de atualização (a maioria dos deploys)

Sempre nessa ordem — parar antes de trocar arquivo em disco, porque o
processo Node mantém `dist/` aberto:

```powershell
nssm stop NovatechHelpdesk

cd caminho\pro\projeto
git pull

cd frontend
npm install   # só se package.json mudou
npm run build

cd ..\backend
npm install   # só se package.json mudou
npm run build

# Só se houver migration nova (ver git log do que veio no pull):
npm run migration:run:prod

nssm start NovatechHelpdesk
```

---

## ⚠️ 6. Sequência ESPECIAL — atualização que inclui a criptografia de campo (Tarefa/Anotação)

**Esta seção documenta um deploy específico: a atualização que introduz
a criptografia de campo em `Tarefa.titulo`, `Tarefa.descricao` e
`Anotacao.conteudo`** (ver `README.md`, seção "Criptografia de campo").
Se o banco de produção já tem Tarefa/Anotação criada ANTES dessa
atualização, **o fluxo normal da seção 5 vai quebrar o sistema** —
leia isto antes de aplicar esse deploy específico no servidor real.

**Por quê**: assim que o código novo (com o transformer de criptografia)
começa a rodar, TODA leitura de Tarefa/Anotação já existente no banco
tenta descriptografar um valor que ainda está em texto puro, e falha
(500 em qualquer tela que liste tarefas ou anotações) — isso foi
confirmado testando de verdade contra dado real, não é uma hipótese.
Isso só para de acontecer depois que o script de migração de dado roda.

**A ordem certa, só para ESTE deploy** (diferente da seção 5 — aqui o
script de migração de dado entra ANTES de reiniciar o serviço com o
código novo):

```powershell
# 1. Para o serviço (ainda rodando o código ANTIGO, sem o transformer)
nssm stop NovatechHelpdesk

# 2. Atualiza o código e builda, mas NÃO reinicia o serviço ainda
cd caminho\pro\projeto
git pull

cd frontend
npm run build

cd ..\backend
npm install   # só se package.json mudou (este deploy não adiciona dependência nova)
npm run build

# 3. Roda o script de migração de dado ANTES de subir o serviço —
#    ele lê/escreve direto no banco via SQL bruto, sem precisar do
#    serviço rodando:
npm run criptografar:migrar:prod

#    Confirme a saída no console: algo como
#    "tarefa: N linha(s) no total — N criptografada(s) agora, 0 já estavam."
#    "anotacao: N linha(s) no total — N criptografada(s) agora, 0 já estavam."
#    Rodar de novo não tem problema (script é idempotente) — se tiver
#    dúvida se rodou, pode rodar outra vez pra conferir.

# 4. SÓ AGORA sobe o serviço com o código novo:
nssm start NovatechHelpdesk
```

**Se alguém seguir o fluxo normal da seção 5 por engano** (reiniciar o
serviço com o código novo antes de rodar o script): pare o serviço de
novo, rode `npm run criptografar:migrar:prod`, e suba o serviço outra
vez — nenhum dado é perdido, o transformer só recusa ler texto puro,
não apaga nada. Mas evite deixar o site nesse estado por muito tempo.

Depois desse deploy específico, o `npm run criptografar:migrar:prod`
não precisa mais ser rodado em deploys futuros — é um passo único, só
para a transição de "texto puro" para "criptografado". Deploys
seguintes voltam a usar o fluxo normal da seção 5.

---

## Troubleshooting comum

- **Serviço não inicia / para sozinho logo em seguida**: veja o log do
  NSSM (`nssm set NovatechHelpdesk AppStdout caminho\log.txt` e
  `AppStderr` configurados na criação, ou configure agora e reinicie) —
  geralmente é `DATABASE_URL`/`JWT_SECRET` ausente ou banco inacessível.
- **API sobe mas todo GET de Tarefa/Anotação devolve 500**: veja a seção
  6 acima — provavelmente o código novo subiu antes do script de
  migração rodar.
- **Precisa aplicar um novo deploy comum**: siga a seção 5. Só use a
  seção 6 na atualização específica da criptografia de campo.
