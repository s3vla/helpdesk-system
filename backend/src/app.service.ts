import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Rota raiz só serve pra confirmar "a API está no ar" sem precisar de
  // token — útil pra testar rapidamente que o servidor subiu. `modoDemo`
  // pendurado aqui pelo mesmo motivo: é o único jeito do frontend (outro
  // deploy, outra origem) descobrir se está falando com um ambiente de
  // demonstração sem duplicar a decisão numa variável própria dele — o
  // backend é a única fonte de verdade sobre o próprio ambiente.
  getStatus(): { status: string; servico: string; modoDemo: boolean } {
    return {
      status: 'ok',
      servico: 'Empresa Exemplo Help Desk API',
      modoDemo: process.env.MODO_DEMO === 'true',
    };
  }
}
