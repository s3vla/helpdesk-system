import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Dicionário administrável de termos que forçam nível N3 na triagem
// automática (ver calcularNivelSugerido em nivel-triagem.util.ts) —
// substitui os dois arrays hardcoded que existiam antes direto no código.
// Uma palavra ativa encontrada no texto do chamado (descrição +
// mensagemErro) sempre sobrepõe o nivelPadrao da categoria, nunca o
// contrário.
@Entity()
export class PalavraChaveN3 {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  palavra: string;

  // Desativar em vez de excluir quando só se quer parar de aplicar a regra
  // temporariamente, sem perder o cadastro.
  @Column({ default: true })
  ativo: boolean;
}
