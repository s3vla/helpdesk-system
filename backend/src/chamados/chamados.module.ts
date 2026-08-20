import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chamado } from './entities/chamado.entity';
import { Comentario } from '../comentarios/entities/comentario.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ChamadosService } from './chamados.service';
import { ChamadosController } from './chamados.controller';
import { ComentariosModule } from '../comentarios/comentarios.module';
import { SolucoesConhecidasModule } from '../solucoes-conhecidas/solucoes-conhecidas.module';
import { ObservadoresModule } from '../observadores/observadores.module';

@Module({
  imports: [
    // Comentario entra aqui (além de em ComentariosModule) porque
    // ChamadosService grava um comentário automático de auditoria ao
    // reclassificar o nível de um chamado (ver reclassificarNivel) — registrar
    // a entity de novo neste módulo é o jeito do TypeORM liberar o repositório
    // pra injeção direta em ChamadosService, sem precisar rotear essa escrita
    // através de ComentariosService (que existe pra comentários digitados por
    // gente, com sua própria checagem de dono do chamado). Usuario entra pelo
    // mesmo motivo: criarComoTecnico precisa validar o solicitanteId
    // informado sem importar UsuariosModule (que já importa ESTE módulo —
    // importar de volta criaria um ciclo).
    TypeOrmModule.forFeature([Chamado, Comentario, Usuario]),
    ComentariosModule,
    SolucoesConhecidasModule,
    ObservadoresModule,
  ],
  providers: [ChamadosService],
  controllers: [ChamadosController],
  // Exportado para o UsuariosModule usar em GET /usuarios/:id/chamados.
  exports: [ChamadosService],
})
export class ChamadosModule {}
