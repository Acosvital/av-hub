import { OrderTypeKey } from '@/services/dashboards/vendorDetailsMapper';

// Fonte única de cor por categoria/status de pedido — antes duplicada (com
// estrutura levemente diferente) em Order.tsx e OrderType.tsx.
const ORDER_TYPE_COLORS: Record<OrderTypeKey, { default: string; light: string }> = {
  SPOT: { default: 'var(--green)', light: 'var(--green-light)' },
  CONTRATO: { default: 'var(--purple)', light: 'var(--purple-light)' },
  'SEM CLASSIFICAÇÃO': { default: 'var(--foreground)', light: 'var(--foreground)' },
  CANCELADOS: { default: 'var(--red)', light: 'var(--red-light)' },
  DEVOLVIDOS: { default: 'var(--blue)', light: 'var(--blue-light)' },
  RECUSADOS: { default: 'var(--yellow)', light: 'var(--yellow-light)' },
  REFATURAMENTO: { default: 'var(--orange)', light: 'var(--orange-light)' },
};

export default ORDER_TYPE_COLORS;
