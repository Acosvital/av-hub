import toBRL from '@/utils/toBRL';

export interface BillingHistoryItem {
  mes: string;
  faturamento: number;
}

export function valueFormatter(value: number | null) {
  return value != null ? toBRL(value) : '';
}
