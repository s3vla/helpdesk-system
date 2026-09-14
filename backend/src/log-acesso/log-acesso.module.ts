import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogAcesso } from './entities/log-acesso.entity';
import { LogAcessoService } from './log-acesso.service';

// Sem controller próprio — mesmo padrão de LogAuditoriaModule. AuthModule
// importa este módulo pra registrar o login; RelatoriosModule importa pra
// ler os últimos acessos no relatório.
@Module({
  imports: [TypeOrmModule.forFeature([LogAcesso])],
  providers: [LogAcessoService],
  exports: [LogAcessoService],
})
export class LogAcessoModule {}
