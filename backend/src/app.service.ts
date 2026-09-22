import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Rota raiz só serve pra confirmar "a API está no ar" sem precisar de
  // token — útil pra testar rapidamente que o servidor subiu.
  getStatus(): { status: string; servico: string } {
    return { status: 'ok', servico: 'Empresa Exemplo Help Desk API' };
  }
}
