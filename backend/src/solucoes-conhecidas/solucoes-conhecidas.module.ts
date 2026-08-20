import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolucaoConhecida } from './entities/solucao-conhecida.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { SolucoesConhecidasService } from './solucoes-conhecidas.service';
import { SolucoesConhecidasController } from './solucoes-conhecidas.controller';

// TypeOrmModule.forFeature([...]) registra, só dentro deste módulo, os
// repositórios das entities listadas — é o que torna @InjectRepository(X)
// possível nos providers declarados aqui embaixo.
@Module({
  imports: [TypeOrmModule.forFeature([SolucaoConhecida, Chamado])],
  providers: [SolucoesConhecidasService],
  controllers: [SolucoesConhecidasController],
  // `exports` torna o SolucoesConhecidasService disponível para quem
  // importar este módulo — é assim que o ChamadosModule consegue injetá-lo
  // para criar uma solução ao finalizar um chamado.
  exports: [SolucoesConhecidasService],
})
export class SolucoesConhecidasModule {}
