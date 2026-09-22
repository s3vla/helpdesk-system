// Registrado como `setupFiles` em test/jest-e2e.json — é o único ponto
// GARANTIDAMENTE anterior a qualquer import de AppModule dentro de um
// arquivo .e2e-spec.ts (imports sempre resolvem antes do corpo do módulo
// que importa rodar). Necessário porque src/config/emails-autorizados.ts
// lê EMAILS_TECNICO_AUTORIZADOS/EMAILS_COLABORADOR_AUTORIZADOS direto de
// process.env no momento em que o módulo é avaliado (fail-fast se
// ausente) — sem isso, qualquer teste que importe AppModule quebra antes
// de qualquer coisa rodar.
process.env.EMAILS_TECNICO_AUTORIZADOS =
  'suporte@empresa-exemplo.com,ti@empresa-exemplo.com';
process.env.EMAILS_COLABORADOR_AUTORIZADOS = 'rh@empresa-exemplo.com';
