import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grupo } from './entities/grupo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Aviso } from '../avisos/entities/aviso.entity';
import { GruposService } from './grupos.service';
import { GruposController } from './grupos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Grupo, Usuario, Aviso])],
  providers: [GruposService],
  controllers: [GruposController],
})
export class GruposModule {}
