import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Substitui o antigo enum CategoriaChamado (HARDWARE/SOFTWARE/REDE/ACESSO/
// OUTRO, fixo em código) — agora o técnico cadastra categorias novas pela
// tela de Administração, sem precisar de deploy. `nome` é o que aparece em
// toda a UI (dropdown de abertura de chamado, filtros, e-mails) — não tem
// mais um "rótulo de exibição" separado do valor interno, diferente do
// esquema antigo do frontend (CATEGORIA_PARA_API/CATEGORIA_DA_API).
@Entity()
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  // Sem exclusão física (ver CategoriasService) — desativar em vez de
  // apagar preserva a categoria de todo chamado/solução antigo que ainda
  // aponta pra ela (FK NOT NULL, nunca pode ficar órfã). Só entra no
  // dropdown de abertura de chamado e nos filtros quando true.
  @Column({ default: true })
  ativo: boolean;

  // Substitui a comparação `categoria === CategoriaChamado.REDE` que
  // nivel-triagem.util.ts fazia antes — com categoria dinâmica, comparar
  // por nome/enum não faz mais sentido (o nome pode ser editado, e uma
  // categoria nova como "VPN" também poderia ser "tipo rede" sem se chamar
  // literalmente "Rede"). Marcável na tela de Administração; só a
  // categoria "Rede" original vem com isso true, seedada pela migration.
  @Column({ default: false })
  consideradaRede: boolean;
}
