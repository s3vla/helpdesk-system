import { IsString, MinLength } from 'class-validator';

// PATCH /anotacoes/:id — só existe um campo editável (`conteudo`), então
// diferente de AtualizarTarefaDto/AtualizarAvisoDto ele não é opcional
// aqui: não faria sentido um PATCH que não muda nada.
export class AtualizarAnotacaoDto {
  @IsString()
  @MinLength(1)
  conteudo: string;
}
