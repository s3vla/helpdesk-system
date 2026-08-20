import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { ChamadosModule } from '../chamados/chamados.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), ChamadosModule],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  // Exportado porque o AuthModule precisa criar e buscar usuários durante
  // login/primeiro-acesso.
  exports: [UsuariosService],
})
export class UsuariosModule {}
