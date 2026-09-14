import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { LogAuditoria } from '../log-auditoria/entities/log-auditoria.entity';
import { LogAcessoModule } from '../log-acesso/log-acesso.module';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Chamado, LogAuditoria]),
    LogAcessoModule,
  ],
  providers: [RelatoriosService],
  controllers: [RelatoriosController],
})
export class RelatoriosModule {}
