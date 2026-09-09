import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // NestExpressApplication (em vez do tipo genérico) dá acesso a
  // useStaticAssets — precisa dele pra servir os arquivos de uploads/ como
  // arquivos estáticos comuns (GET /uploads/nome-do-arquivo.png).
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Prefixo comum a TODA rota de controller (inclusive a raiz do
  // AppController e o POST de upload) — libera GET / pro index.html do
  // frontend, servido pelo ServeStaticModule (ver app.module.ts). Não
  // afeta app.useStaticAssets logo abaixo: é middleware Express puro, não
  // passa pelo roteamento do Nest.
  app.setGlobalPrefix('api');

  // Headers de segurança padrão (X-Content-Type-Options, X-Frame-Options,
  // Referrer-Policy etc — ver documentação do helmet pra lista completa) —
  // faltavam antes (auditoria de segurança encontrou o gap). Desde que o
  // ServeStaticModule passou a servir o HTML/JS/CSS do frontend por essa
  // mesma porta (ver app.module.ts), o CSP padrão do helmet passa a valer
  // pra página de verdade, não só pra respostas JSON.
  //
  // `upgrade-insecure-requests` é um dos padrões do CSP do helmet — instrui
  // o NAVEGADOR a reescrever toda requisição HTTP da página pra HTTPS
  // automaticamente. Enquanto o servidor roda em HTTP puro (fase de teste
  // em rede interna, sem certificado ainda), isso quebra o carregamento dos
  // assets: o navegador tenta buscar /assets/index-*.js via HTTPS, não
  // existe HTTPS nesse servidor, e a página fica em branco. Só ativa quando
  // `HTTPS_ATIVO=true` estiver no .env — não esquecer de setar isso quando
  // o certificado entrar em produção.
  const httpsAtivo = process.env.HTTPS_ATIVO === 'true';
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...(httpsAtivo ? {} : { 'upgrade-insecure-requests': null }),
        },
      },
    }),
  );

  // Um servidor novo (ex: primeiro deploy) não tem essa pasta ainda — sem
  // isso, o primeiro upload falharia com ENOENT em vez de depender de
  // alguém lembrar de criá-la manualmente. `recursive: true` também não
  // erra se ela já existir.
  const pastaUploads = join(__dirname, '..', 'uploads');
  mkdirSync(pastaUploads, { recursive: true });

  app.useStaticAssets(pastaUploads, {
    prefix: '/uploads/',
  });

  // ValidationPipe GLOBAL: aplica automaticamente as regras dos DTOs
  // (@IsEmail, @IsEnum, @IsNotEmpty...) em toda rota, sem precisar repetir
  // isso controller por controller.
  app.useGlobalPipes(
    new ValidationPipe({
      // Remove do objeto qualquer campo que não esteja declarado no DTO —
      // impede alguém de mandar `{ tipo: 'TECNICO' }` escondido dentro do
      // corpo de um POST /chamados, por exemplo, e esse campo ser ignorado
      // silenciosamente em vez de simplesmente não existir.
      whitelist: true,
      // Além de remover, rejeita a requisição inteira (400) se vier algum
      // campo extra — fail loud em vez de fail silent.
      forbidNonWhitelisted: true,
      // Converte automaticamente strings de query/route param pros tipos
      // esperados pelo DTO (necessário pros enums de FiltrosChamadoDto, por
      // exemplo, já que query string chega sempre como texto).
      transform: true,
    }),
  );

  // CORS restrito às origens definidas em CORS_ORIGIN (lista separada por
  // vírgula) — nunca `origin: '*'`. Em dev, cai num default seguro apontando
  // pro Vite do frontend caso a variável não esteja definida.
  const origensPermitidas = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origem) => origem.trim());
  app.enableCors({ origin: origensPermitidas, credentials: true });

  const porta = process.env.PORT ?? 3000;
  await app.listen(porta);
  console.log(
    `Novatech Agro Help Desk API rodando em http://localhost:${porta}`,
  );
}
// bootstrap() é async — sem tratar a Promise, um erro na inicialização
// (ex: JWT_SECRET ausente) falharia em silêncio. .catch aqui garante que o
// processo termine com o erro visível no log em vez de sumir.
bootstrap().catch((erro: unknown) => {
  console.error('Falha ao iniciar a API:', erro);
  process.exit(1);
});
