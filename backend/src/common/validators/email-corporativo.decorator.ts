import { applyDecorators } from '@nestjs/common';
import { IsEmail, Matches } from 'class-validator';

// Decorator composto: junta duas regras de validação (formato de e-mail +
// domínio obrigatório @novatechagro.com.br) numa anotação só, para não
// repetir os dois decorators em cada DTO que recebe e-mail (login e
// primeiro-acesso). applyDecorators só "empilha" os decorators passados,
// como se cada um tivesse sido escrito na propriedade separadamente.
export function EmailCorporativo() {
  return applyDecorators(
    IsEmail({}, { message: 'E-mail inválido' }),
    Matches(/@novatechagro\.com\.br$/i, {
      message: 'Use seu e-mail corporativo @novatechagro.com.br',
    }),
  );
}
