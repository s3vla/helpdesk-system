import { UsuarioResponseDto } from './usuario-response.dto';

// GET /usuarios (tela "Colaboradores") — mesmo formato de
// UsuarioResponseDto, com a contagem de chamados já embutida numa única
// query agrupada (ver ChamadosService.contarPorSolicitantes), em vez do
// frontend precisar de uma chamada GET /usuarios/:id/chamados por linha
// da lista — era esse padrão N+1 que gerava requisição suficiente pra
// estourar o rate limit global só de abrir a tela com volume normal de
// colaboradores cadastrados.
export class ColaboradorListaResponseDto extends UsuarioResponseDto {
  totalChamados: number;
  chamadosAbertos: number;
  chamadosFinalizados: number;
}
