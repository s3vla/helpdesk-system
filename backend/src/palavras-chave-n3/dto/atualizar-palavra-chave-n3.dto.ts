import { IsBoolean, IsOptional } from 'class-validator';

// PATCH /palavras-chave-n3/:id — só ativa/desativa (a palavra em si não é
// editável depois de criada, mesmo raciocínio de Categoria.nome: evita
// confusão sobre "isso é o mesmo termo de antes?"; pra corrigir um erro de
// digitação, exclui e recria).
export class AtualizarPalavraChaveN3Dto {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
