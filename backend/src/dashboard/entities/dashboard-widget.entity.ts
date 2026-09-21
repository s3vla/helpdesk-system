import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AgruparPor } from '../../common/enums/agrupar-por.enum';
import { TipoMetrica } from '../../common/enums/tipo-metrica.enum';
import { FormatoVisualWidget } from '../../common/enums/formato-visual-widget.enum';

// Configuração de um widget do Dashboard TI. Compartilhada entre os
// técnicos de propósito (ver decisão no pedido da feature) — SEM FK pra
// Usuario, uma única lista pra todo o sistema, qualquer técnico pode
// criar/editar/reordenar/remover, sem noção de "dono" do widget.
@Entity()
export class DashboardWidget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  // Nullable: widgets formatoVisual=LINHA não têm "contagem vs ranking" —
  // são sempre uma contagem diária (ver ChamadosService.obterMetricasDiarias).
  @Column({ type: 'enum', enum: TipoMetrica, nullable: true })
  tipo: TipoMetrica | null;

  // Aceita os 7 valores de AgruparPor (diferente de MetricasChamadoDto, que
  // só aceita 6) — é aqui que o widget fixo de repetição referencia
  // AgruparPor.REPETICAO_CATEGORIA. Nullable pelo mesmo motivo de `tipo`
  // acima — widgets de linha não têm "o que agrupar", a série já é fixa
  // (abertos vs finalizados por dia).
  @Column({ type: 'enum', enum: AgruparPor, nullable: true })
  agruparPor: AgruparPor | null;

  @Column({ type: 'enum', enum: FormatoVisualWidget })
  formatoVisual: FormatoVisualWidget;

  // Só tem efeito quando tipo=ranking (ignorado em silêncio quando
  // tipo=contagem, mesma regra de MetricasChamadoDto.limite).
  @Column({ type: 'int', nullable: true })
  limite: number | null;

  // Posição na lista — trocada aos pares por
  // DashboardWidgetsService.mover(), nunca escrita direto por um PATCH de
  // campo genérico (ver comentário em atualizar()).
  @Column({ type: 'int' })
  ordem: number;

  // Desativado ≠ excluído: `ativo: false` só tira o widget da tela
  // "Dashboard" (consulta), mas ele continua listado em "Criar Dashboard"
  // (administração) pra poder reativar depois. Exclusão de verdade é
  // DELETE, uma linha a menos nesta tabela.
  @Column({ default: true })
  ativo: boolean;

  // true só no widget de repetição (criado pelo seed) — bloqueia DELETE em
  // DashboardWidgetsService.remover(), mas não impede editar, desativar ou
  // reordenar.
  @Column({ default: false })
  fixo: boolean;
}
