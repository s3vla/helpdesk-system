import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  // NestExpressApplication (em vez do tipo genérico) dá acesso a
  // useStaticAssets — precisa dele pra servir os arquivos de uploads/ como
  // arquivos estáticos comuns (GET /uploads/nome-do-arquivo.png).
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
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
