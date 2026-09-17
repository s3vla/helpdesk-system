import { Body, Controller, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ComentariosService } from './comentarios.service';
import { EditarComentarioDto } from './dto/editar-comentario.dto';
import { mapComentarioParaResposta } from './dto/comentario-response.dto';

// Controller próprio, diferente de criar/listar (que vivem aninhados sob
// ChamadosController, em /chamados/:id/comentarios) — editar não precisa do
// chamadoId na URL, o id do comentário já é suficiente, e a permissão é
// mais estrita (só o autor, ver ComentariosService.editar) do que a regra
// de acesso ao chamado usada nas outras rotas. Sem @Roles: tanto
// colaborador quanto técnico podem editar comentário PRÓPRIO.
@Controller('comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Patch(':id')
  async editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarComentarioDto,
    @UsuarioAtual() usuarioAtual: JwtPayload,
  ) {
    const comentario = await this.comentariosService.editar(
      id,
      dto,
      usuarioAtual,
    );
    return mapComentarioParaResposta(comentario);
  }
}
