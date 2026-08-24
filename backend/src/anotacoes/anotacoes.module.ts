import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anotacao } from './entities/anotacao.entity';
import { AnotacoesService } from './anotacoes.service';
import { AnotacoesController } from './anotacoes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Anotacao])],
  providers: [AnotacoesService],
  controllers: [AnotacoesController],
})
export class AnotacoesModule {}
