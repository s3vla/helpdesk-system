import { BadRequestException } from '@nestjs/common';

// Extraído de ChamadosService.resolverPeriodo (era privado lá) pra ser
// reaproveitado por RelatoriosService também — mesmo comportamento padrão
// em ambos: sem dataInicio/dataFim, os últimos 30 dias terminando agora.
export interface FiltroPeriodo {
  dataInicio?: string;
  dataFim?: string;
}

export interface Periodo {
  inicio: Date;
  fim: Date;
}

// Datas explícitas chegam como "YYYY-MM-DD" (formato de <input
// type="date">) — construídas com horário local explícito
// (T00:00:00/T23:59:59) pra não cair na interpretação UTC-meia-noite que
// o JS dá a uma data "pelada", que poderia empurrar o dia errado
// dependendo do fuso de quem roda o servidor.
export function resolverPeriodo(filtros: FiltroPeriodo): Periodo {
  const DIAS_PADRAO_PERIODO = 30;
  const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

  const fim = filtros.dataFim
    ? new Date(`${filtros.dataFim}T23:59:59.999`)
    : new Date();
  if (!filtros.dataFim) fim.setHours(23, 59, 59, 999);

  const inicio = filtros.dataInicio
    ? new Date(`${filtros.dataInicio}T00:00:00.000`)
    : new Date(
        fim.getTime() - (DIAS_PADRAO_PERIODO - 1) * MILISSEGUNDOS_POR_DIA,
      );
  if (!filtros.dataInicio) inicio.setHours(0, 0, 0, 0);

  if (inicio > fim) {
    throw new BadRequestException(
      'Data de início não pode ser depois da data de fim',
    );
  }

  return { inicio, fim };
}
