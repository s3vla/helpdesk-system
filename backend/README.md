<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Banco de dados / Migrations

O schema é controlado por **migrations** do TypeORM (`src/migrations/`), não
por `synchronize: true` — isso foi trocado logo cedo (banco ainda de
teste/vazio, antes do primeiro deploy real) porque é bem mais arriscado
migrar depois, com dado real acumulado. `synchronize: false` está fixado em
`src/app.module.ts`; a `InitialSchema` congela o schema que existia até essa
troca (validada como estruturalmente idêntica ao que `synchronize: true`
gerava — mesmas colunas, tipos, defaults, PKs, FKs e índices).

**No primeiro deploy** (banco novo, vazio), depois do `npm run build`:

```bash
npm run migration:run:prod   # roda contra o dist/ já buildado, sem precisar de ts-node
```

**Criando uma migration nova**, sempre que alguém alterar uma entity
(adicionar/remover coluna, mudar tipo, nova tabela etc.):

```bash
# 1. Altere a entity normalmente em src/**/entities/*.entity.ts
# 2. Gere a migration comparando as entities com o banco de dev atual:
npm run migration:generate -- src/migrations/NomeDescritivoDaMudanca

# 3. Revise o arquivo gerado em src/migrations/ (o gerador é bom, mas não
#    é infalível — principalmente em renomeação de coluna, que ele vê como
#    "remover uma + criar outra", perdendo o dado se você não ajustar
#    manualmente pra um ALTER/rename).

# 4. Aplique no seu banco de dev local:
npm run migration:run
```

Outros comandos úteis: `npm run migration:revert` (desfaz a última
migration aplicada) e `npm run migration:create -- src/migrations/Nome`
(cria um arquivo de migration vazio, pra escrever SQL na mão em vez de
gerar a partir do diff de entities).

`src/data-source.ts` é a config usada só pela CLI acima (fora do Nest, sem
`ConfigService` — lê `.env` direto via `dotenv/config`). Precisa ter a
mesma lista de entities que `src/app.module.ts` sempre que uma entity nova
for criada.

## Quem pode logar (e-mails autorizados)

`src/config/emails-autorizados.ts` é a lista fechada de e-mails/domínios
autorizados a ter conta no sistema (técnicos, colaboradores, domínios de
e-mail corporativo aceitos). Isso é **intencionalmente hardcoded no
código, não uma variável de ambiente** — adicionar, remover ou trocar
alguém da lista exige alterar esse arquivo e fazer um novo deploy, não dá
pra mudar só editando o `.env` do servidor. Ver comentário no topo do
arquivo para o motivo.

## Deployment

Deploy real deste projeto é via **IIS + iisnode** (Windows Server) — ver
[`DEPLOY-IIS.md`](./DEPLOY-IIS.md) pro passo a passo completo
(Application Pool, variáveis de ambiente, criação do site, permissões de
pasta). `web.config` na raiz deste diretório já está configurado.

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
