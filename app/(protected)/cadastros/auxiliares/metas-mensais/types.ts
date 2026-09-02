export const MESES: Record<number, string> = {
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

export const TIPOS_META: Record<'venda' | 'faturamento', string> = {
  venda: 'Venda',
  faturamento: 'Faturamento',
};

export interface MetaMensalProps {
  mes: number;
  ano: number;
  meta: number;
  tipo: 'venda' | 'faturamento';
}

export interface FormMeta {
  mes: number | '';
  ano: number | '';
  meta: string;
  tipo: 'venda' | 'faturamento';
}
