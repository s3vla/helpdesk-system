import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogAuditoria } from './entities/log-auditoria.entity';
import { LogAuditoriaService } from './log-auditoria.service';

// Sem controller próprio: a rota (/chamados/:id/logs) é aninhada sob
// "chamados" no contrato da API, igual ComentariosModule — quem a expõe é
// o ChamadosController, que importa este módulo só para injetar o service.
@Module({
  imports: [TypeOrmModule.forFeature([LogAuditoria])],
  providers: [LogAuditoriaService],
  exports: [LogAuditoriaService],
})
export class LogAuditoriaModule {}
