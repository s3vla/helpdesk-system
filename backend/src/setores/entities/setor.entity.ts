import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Setor organizacional (RH, Financeiro, Diretoria...) — substitui o texto
// livre que Usuario.departamento aceitava antes. `nome` único: evita
// "Financeiro" e "financeiro" coexistindo como setores diferentes por
// erro de digitação na tela de admin. Sem "ativo" de propósito (diferente
// de Categoria) — desativar um setor não tem o mesmo motivo de negócio
// que desativar uma categoria de chamado; se um dia for preciso, é um
// campo fácil de adicionar depois.
@Entity()
export class Setor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;
}
