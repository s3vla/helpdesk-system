import { IsInt } from 'class-validator';

// PATCH /setores/mapeamentos/:id — só troca o setor de destino; o
// prefixo em si não muda depois de criado (trocar o prefixo é excluir e
// criar de novo, não uma edição).
export class AtualizarMapeamentoSetorDto {
  @IsInt()
  setorId: number;
}
