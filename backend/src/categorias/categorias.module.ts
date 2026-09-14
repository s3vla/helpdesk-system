import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { SolucaoConhecida } from '../solucoes-conhecidas/entities/solucao-conhecida.entity';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';

@Module({
  // Chamado/SolucaoConhecida entram aqui só pra CategoriasService.remover
  // poder CONTAR quantos apontam pra uma categoria antes de excluir —
  // leitura direta do repositório, sem importar ChamadosModule/
  // SolucoesConhecidasModule (que, por sua vez, já importam
  // CategoriasModule — importar de volta criaria um ciclo). Mesmo atalho
  // já usado em SolucoesConhecidasService (injeta Chamado direto) e
  // ChamadosService (injeta Usuario direto).
  imports: [TypeOrmModule.forFeature([Categoria, Chamado, SolucaoConhecida])],
  providers: [CategoriasService],
  controllers: [CategoriasController],
  // ChamadosModule precisa de CategoriasService pra resolver `categoria`
  // (string) do corpo de POST /chamados numa entity de verdade, e pra
  // zero-preencher o gráfico de "Distribuição por categoria" — ver
  // ChamadosModule.imports.
  exports: [CategoriasService],
})
export class CategoriasModule {}
