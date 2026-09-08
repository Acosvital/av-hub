import dayjs from 'dayjs';

export type OrderCategory = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
export type OrderStatus = 'CANCELADOS' | 'DEVOLVIDOS' | 'RECUSADOS' | 'REFATURAMENTO';
export type OrderTypeKey = OrderCategory | OrderStatus;

export interface VendorOrder {
  id: number;
  date: string;
  partner: string;
  value: number;
  category: OrderCategory;
  status?: OrderStatus;
}

export interface OrderTypeSummary {
  orderType: OrderTypeKey;
  count: number;
  value: number;
  cardType?: 'double';
}

export interface VendorDetails {
  name: string;
  totalValue: number;
  totalOrders: number;
  orderTypes: OrderTypeSummary[];
  orders: VendorOrder[];
}

export interface ResumoVendedor {
  vendedor: string | null;
  total_pedidos: string | null;
  total_nfs: string | null;
  valor_total: string | null;
  qtd_spot: string | null;
  valor_spot: string | null;
  qtd_contrato: string | null;
  valor_contrato: string | null;
  qtd_sem_classificacao: string | null;
  valor_sem_classificacao: string | null;
  qtd_cancelado: string | null;
  valor_cancelado: string | null;
  qtd_devolvido: string | null;
  valor_devolvido: string | null;
  qtd_recusado: string | null;
  valor_recusado: string | null;
  qtd_refaturamento: string | null;
  valor_refaturamento: string | null;
}

export interface PedidoVendedor {
  numero_nf: string | null;
  numero_pedido: string | null;
  nome_cliente: string | null;
  data_pedido: string | null;
  data_emissao: string | null;
  valor_pedido: string | null;
  valor_nf: string | null;
  tipo_contrato: string;
  classificacao: string;
}

export const ORDER_CATEGORIES: OrderCategory[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];
export const ORDER_STATUSES: OrderStatus[] = ['CANCELADOS', 'DEVOLVIDOS', 'RECUSADOS', 'REFATURAMENTO'];

export function resolveCategory(tipoContrato: string): OrderCategory {
  const normalized = tipoContrato?.trim().toUpperCase();
  return (ORDER_CATEGORIES as string[]).includes(normalized)
    ? (normalized as OrderCategory)
    : 'SEM CLASSIFICAÇÃO';
}

export function resolveStatus(situacao: string): OrderStatus | undefined {
  const normalized = situacao.split(' ')[0]?.trim().toUpperCase();
  return (ORDER_STATUSES as string[]).includes(normalized)
    ? (normalized as OrderStatus)
    : undefined;
}

export function mapVendorDetails(
  dashboard: 'vendas' | 'faturamento',
  vendedor: ResumoVendedor,
  detalhes: PedidoVendedor[]
): VendorDetails {
  return {
    name: vendedor.vendedor ?? '—',
    totalValue: Number(vendedor.valor_total) || 0,
    totalOrders:
      dashboard === 'vendas'
        ? Number(vendedor.total_pedidos) || 0
        : Number(vendedor.total_nfs) || 0,
    orderTypes: [
      {
        orderType: 'SPOT',
        count: Number(vendedor.qtd_spot) || 0,
        value: Number(vendedor.valor_spot) || 0,
      },
      {
        orderType: 'CONTRATO',
        count: Number(vendedor.qtd_contrato) || 0,
        value: Number(vendedor.valor_contrato) || 0,
      },
      {
        orderType: 'SEM CLASSIFICAÇÃO',
        count: Number(vendedor.qtd_sem_classificacao) || 0,
        value: Number(vendedor.valor_sem_classificacao) || 0,
        cardType: 'double',
      },
      {
        orderType: 'CANCELADOS',
        count: Number(vendedor.qtd_cancelado) || 0,
        value: Number(vendedor.valor_cancelado) || 0,
      },
      {
        orderType: 'DEVOLVIDOS',
        count: Number(vendedor.qtd_devolvido) || 0,
        value: Number(vendedor.valor_devolvido) || 0,
      },
      {
        orderType: 'RECUSADOS',
        count: Number(vendedor.qtd_recusado) || 0,
        value: Number(vendedor.valor_recusado) || 0,
      },
      {
        orderType: 'REFATURAMENTO',
        count: Number(vendedor.qtd_refaturamento) || 0,
        value: Number(vendedor.valor_refaturamento) || 0,
      },
    ],
    orders: detalhes.map((pedido) => {
      return {
        id: dashboard === 'vendas' ? Number(pedido.numero_pedido) : Number(pedido.numero_nf) || 0,
        date:
          dashboard === 'vendas'
            ? dayjs(pedido.data_pedido).format('DD/MM/YYYY')
            : dayjs(pedido.data_emissao).format('DD/MM/YYYY'),
        partner: pedido.nome_cliente ?? '—',
        value:
          dashboard === 'vendas' ? Number(pedido.valor_pedido) || 0 : Number(pedido.valor_nf) || 0,
        category: resolveCategory(pedido.tipo_contrato),
        status: dashboard === 'faturamento' ? resolveStatus(pedido.classificacao) : undefined,
      };
    }),
  };
}
