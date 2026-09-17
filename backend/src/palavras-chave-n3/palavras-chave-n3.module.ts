import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PalavraChaveN3 } from './entities/palavra-chave-n3.entity';
import { PalavrasChaveN3Service } from './palavras-chave-n3.service';
import { PalavrasChaveN3Controller } from './palavras-chave-n3.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PalavraChaveN3])],
  providers: [PalavrasChaveN3Service],
  controllers: [PalavrasChaveN3Controller],
  // ChamadosModule precisa de PalavrasChaveN3Service pra buscar as
  // palavras ativas na triagem automática (ver ChamadosModule.imports).
  exports: [PalavrasChaveN3Service],
})
export class PalavrasChaveN3Module {}
