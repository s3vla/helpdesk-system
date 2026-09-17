import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NivelChamado } from '../../common/enums/nivel-chamado.enum';

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

  // Ponto de partida do nível sugerido em nivel-triagem.util.ts — cada
  // categoria pode ser configurada pra classificar automaticamente o
  // chamado em N1, N2 ou N3. Uma palavra-chave de PalavraChaveN3 ativa no
  // texto do chamado sempre sobrepõe pra N3, independente do que estiver
  // aqui (ver calcularNivelSugerido). Substitui o antigo `consideradaRede`
  // (boolean, só cobria N2) — categorias que tinham `consideradaRede=true`
  // migraram pra 'N2', preservando o comportamento anterior.
  @Column({ type: 'enum', enum: NivelChamado, default: NivelChamado.N1 })
  nivelPadrao: NivelChamado;
}
