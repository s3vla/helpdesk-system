# Empresa Exemplo — Help Desk

Monorepo com o sistema de chamados de TI da Empresa Exemplo: colaboradores abrem chamados, a Área Técnica atende. Duas partes, cada uma com seu próprio `package.json`:

- **`frontend/`** — React + Vite (JavaScript puro, sem TypeScript)
- **`backend/`** — NestJS + TypeORM + SQLite (`better-sqlite3`)

Contrato completo da API (rotas, DTOs, regras de negócio) documentado em [`backend/CONTRATO.md`](backend/CONTRATO.md).

## 🎬 Demo ao vivo

- Frontend: https://helpdesk-system-tau.vercel.app
- **Login como técnico**: suporte@empresa-exemplo.com / Demo2026!
- **Login como colaborador**: clique em "Primeiro Acesso" e use um dos e-mails autorizados: rh@empresa-exemplo.com ou financeiro@empresa-exemplo.com (você escolhe a senha nesse momento)
- ⏳ O backend roda no plano gratuito da Render — a primeira requisição após um período de inatividade pode levar ~30s pra responder.

## Rodando localmente

Duas partes, dois terminais.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite o `.env` recém-criado e preencha:
- `JWT_SECRET` — qualquer string aleatória longa (ex: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `SEED_TECNICO_1_SENHA` e `SEED_TECNICO_2_SENHA` — senha de bootstrap dos 2 técnicos criados automaticamente no primeiro start (o sistema força a troca dessa senha no primeiro login de cada um)

```bash
npm run start
```

API sobe em `http://localhost:3000`. O banco SQLite (`database.sqlite`) é criado automaticamente no primeiro start, junto com os 2 usuários técnicos de seed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Sobe em `http://localhost:5173`, já apontando pra API em `localhost:3000` por padrão (sem precisar de `.env` — só crie um `frontend/.env` com `VITE_API_URL=...` se a API estiver rodando em outro endereço).

## Contas de teste

Primeiro acesso do colaborador é livre para qualquer e-mail da lista fechada na variável de ambiente `EMAILS_COLABORADOR_AUTORIZADOS` (lista separada por vírgula — ver `.env.example` e `backend/src/config/emails-autorizados.ts`; sem essa variável configurada, a API recusa subir). Os técnicos são os do seed (`SEED_TECNICO_1_EMAIL` / `SEED_TECNICO_2_EMAIL` no `.env`, precisam bater com `EMAILS_TECNICO_AUTORIZADOS`) — login com a senha de bootstrap definida no `.env`, com troca de senha obrigatória no primeiro acesso.
