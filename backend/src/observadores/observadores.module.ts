import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChamadoObservador } from './entities/chamado-observador.entity';
import { Chamado } from '../chamados/entities/chamado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ObservadoresService } from './observadores.service';

// Sem controller próprio: as rotas (/chamados/:id/observadores,
// /chamados/observando) são aninhadas sob "chamados" no contrato da API,
// então quem as expõe é o ChamadosController — mesmo padrão de
// ComentariosModule.
@Module({
  imports: [TypeOrmModule.forFeature([ChamadoObservador, Chamado, Usuario])],
  providers: [ObservadoresService],
  exports: [ObservadoresService],
})
export class ObservadoresModule {}
