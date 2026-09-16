import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aviso } from './entities/aviso.entity';
import { AvisoLeitura } from './entities/aviso-leitura.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Grupo } from '../grupos/entities/grupo.entity';
import { AvisosService } from './avisos.service';
import { AvisosController } from './avisos.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aviso, AvisoLeitura, Usuario, Grupo]),
    EmailModule,
  ],
  providers: [AvisosService],
  controllers: [AvisosController],
})
export class AvisosModule {}
