import { applyDecorators } from '@nestjs/common';
import { IsEmail, Matches } from 'class-validator';
import { DOMINIOS_EMAIL_AUTORIZADOS } from '../../config/emails-autorizados';

// Regex montada a partir de DOMINIOS_EMAIL_AUTORIZADOS (em vez de um
// domínio fixo escrito aqui) — pontos escapados de propósito (`.` sem
// escape casaria qualquer caractere, não só ponto literal). Formato final:
// /@(novatechagro\.com\.br|alvotechagro\.com\.br)$/i.
const DOMINIOS_REGEX = DOMINIOS_EMAIL_AUTORIZADOS.map((dominio) =>
  dominio.replace(/\./g, '\\.'),
).join('|');
const REGEX_DOMINIO_CORPORATIVO = new RegExp(`@(${DOMINIOS_REGEX})$`, 'i');

// Decorator composto: junta duas regras de validação (formato de e-mail +
// domínio corporativo obrigatório) numa anotação só, para não repetir os
// dois decorators em cada DTO que recebe e-mail (login e primeiro-acesso).
// applyDecorators só "empilha" os decorators passados, como se cada um
// tivesse sido escrito na propriedade separadamente.
export function EmailCorporativo() {
  return applyDecorators(
    IsEmail({}, { message: 'E-mail inválido' }),
    Matches(REGEX_DOMINIO_CORPORATIVO, {
      message: `Use seu e-mail corporativo (${DOMINIOS_EMAIL_AUTORIZADOS.map((d) => `@${d}`).join(' ou ')})`,
    }),
  );
}
