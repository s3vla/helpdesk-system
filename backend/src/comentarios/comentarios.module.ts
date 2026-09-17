import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comentario } from './entities/comentario.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { ComentariosService } from './comentarios.service';
import { ComentariosController } from './comentarios.controller';
import { LogAuditoriaModule } from '../log-auditoria/log-auditoria.module';
import { EmailModule } from '../email/email.module';

// Criar/listar (/chamados/:id/comentarios) continuam aninhados sob
// ChamadosController, que importa este módulo só pra injetar
// ComentariosService (ver `exports` abaixo) — sem mudar isso. Editar
// (PATCH /comentarios/:id) é a exceção: tem controller PRÓPRIO aqui
// (ComentariosController), porque não precisa do chamadoId na URL — ver
// comentário no controller.
@Module({
  imports: [
    TypeOrmModule.forFeature([Comentario, Chamado]),
    LogAuditoriaModule,
    EmailModule,
  ],
  providers: [ComentariosService],
  controllers: [ComentariosController],
  exports: [ComentariosService],
})
export class ComentariosModule {}
