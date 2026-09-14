import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria])],
  providers: [CategoriasService],
  controllers: [CategoriasController],
  // ChamadosModule precisa de CategoriasService pra resolver `categoria`
  // (string) do corpo de POST /chamados numa entity de verdade, e pra
  // zero-preencher o gráfico de "Distribuição por categoria" — ver
  // ChamadosModule.imports.
  exports: [CategoriasService],
})
export class CategoriasModule {}
