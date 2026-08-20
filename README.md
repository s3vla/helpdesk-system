# Novatech Agro — Help Desk

Monorepo com o sistema de chamados de TI da Novatech Agro: colaboradores abrem chamados, a Área Técnica atende. Duas partes, cada uma com seu próprio `package.json`:

- **`frontend/`** — React + Vite (JavaScript puro, sem TypeScript)
- **`backend/`** — NestJS + TypeORM + SQLite (`better-sqlite3`)

Contrato completo da API (rotas, DTOs, regras de negócio) documentado em [`backend/CONTRATO.md`](backend/CONTRATO.md).

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

Primeiro acesso do colaborador é livre para qualquer e-mail da lista fechada em `backend/src/config/emails-autorizados.ts` (`EMAILS_COLABORADOR_AUTORIZADOS`). Os 2 técnicos são os do seed (`SEED_TECNICO_1_EMAIL` / `SEED_TECNICO_2_EMAIL` no `.env`, por padrão `suporte@novatechagro.com.br` e `ti@novatechagro.com.br`) — login com a senha de bootstrap definida no `.env`, com troca de senha obrigatória no primeiro acesso.
