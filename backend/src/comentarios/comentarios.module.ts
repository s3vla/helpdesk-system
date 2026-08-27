import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comentario } from './entities/comentario.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { ComentariosService } from './comentarios.service';
import { LogAuditoriaModule } from '../log-auditoria/log-auditoria.module';
import { EmailModule } from '../email/email.module';

// Sem controller próprio: as rotas de comentário (/chamados/:id/comentarios)
// são aninhadas sob "chamados" no contrato da API, então quem as expõe é o
// ChamadosController — ele importa este módulo só para injetar o
// ComentariosService (ver `exports` abaixo).
@Module({
  imports: [
    TypeOrmModule.forFeature([Comentario, Chamado]),
    LogAuditoriaModule,
    EmailModule,
  ],
  providers: [ComentariosService],
  exports: [ComentariosService],
})
export class ComentariosModule {}
