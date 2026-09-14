import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setor } from './entities/setor.entity';
import { MapeamentoSetorEmail } from './entities/mapeamento-setor-email.entity';
import { SetoresService } from './setores.service';
import { SetoresController } from './setores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Setor, MapeamentoSetorEmail])],
  providers: [SetoresService],
  controllers: [SetoresController],
  // AuthModule precisa de SetoresService pra derivar o setor no
  // Primeiro Acesso — ver AuthModule.imports.
  exports: [SetoresService],
})
export class SetoresModule {}
