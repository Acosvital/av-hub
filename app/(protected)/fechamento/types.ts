export const MESES_LABEL: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

export type TipoFechamento = 'venda' | 'faturamento';

// A partir deste mês/ano o fechamento passa a ser automático (lido dos
// dashboards). Antes disso, o total não é confiável (ver
// docs/ENVIAR - contrato-divergencia-faturamento-liquido.md) e precisa ser
// digitado manualmente. Ver docs/ENVIAR - contrato-fechamento-manual.md.
export const INICIO_AUTOMATICO = { mes: 9, ano: 2026 };

export function ehAutomatico(mes: number, ano: number): boolean {
  return ano > INICIO_AUTOMATICO.ano || (ano === INICIO_AUTOMATICO.ano && mes >= INICIO_AUTOMATICO.mes);
}

export interface FechamentoManualProps {
  mes: number;
  ano: number;
  tipo: TipoFechamento;
  valor_total: string;
}

// Um card do grid — já resolvido (manual ou automático), pronto pro gauge.
export interface FechamentoMesProps {
  mes: number;
  ano: number;
  automatico: boolean;
  valorTotal: number | null;
  meta: number | null;
  preenchido: boolean;
}
