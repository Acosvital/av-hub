'use client';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { CircularProgress } from '@mui/material';
import Modal from '@/components/Ui/Modal/Modal';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import OrderType from '@/components/Dashboards/OrderType/OrderType';
import Order from '@/components/Dashboards/Order/Order';
import toBRL from '@/utils/toBRL';
import { getDetalheVendedorVendas } from '@/services/dashboardVendas';
import { getDetalheVendedorFaturamento } from '@/services/dashboardFaturamento';
import styles from './VendorDetailsModal.module.css';

interface VendorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: number | null;
  dashboard: 'vendas' | 'faturamento';
  mes: number;
  ano: number;
}

type OrderCategory = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
type OrderStatus = 'CANCELADO' | 'DEVOLVIDO' | 'RECUSADO' | 'REFATURAMENTO';
type OrderTypeKey = OrderCategory | OrderStatus;

interface VendorOrder {
  id: number;
  date: string;
  partner: string;
  value: number;
  category: OrderCategory;
  status?: OrderStatus;
}

interface OrderTypeSummary {
  orderType: OrderTypeKey;
  count: number;
  value: number;
  cardType?: 'double';
}

interface VendorDetails {
  name: string;
  totalValue: number;
  totalOrders: number;
  orderTypes: OrderTypeSummary[];
  orders: VendorOrder[];
}

interface ResumoVendedor {
  vendedor: string | null;
  total_pedidos: string | null;
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

interface PedidoVendedor {
  numero_nf: string | null;
  numero_pedido: string | null;
  nome_cliente: string | null;
  data_pedido: string;
  valor_pedido: string | null;
  tipo_contrato: string;
  situacao: string;
}

const ORDER_CATEGORIES: OrderCategory[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];
const ORDER_STATUSES: OrderStatus[] = ['CANCELADO', 'DEVOLVIDO', 'RECUSADO', 'REFATURAMENTO'];

function resolveCategory(tipoContrato: string): OrderCategory {
  const normalized = tipoContrato?.trim().toUpperCase();
  return (ORDER_CATEGORIES as string[]).includes(normalized)
    ? (normalized as OrderCategory)
    : 'SEM CLASSIFICAÇÃO';
}

function resolveStatus(situacao: string): OrderStatus | undefined {
  const normalized = situacao?.trim().toUpperCase();
  return (ORDER_STATUSES as string[]).includes(normalized)
    ? (normalized as OrderStatus)
    : undefined;
}

function mapVendorDetails(
  dashboard: 'vendas' | 'faturamento',
  vendedor: ResumoVendedor,
  pedidos: PedidoVendedor[]
): VendorDetails {
  return {
    name: vendedor.vendedor ?? '—',
    totalValue: Number(vendedor.valor_total) || 0,
    totalOrders: Number(vendedor.total_pedidos) || 0,
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
        orderType: 'CANCELADO',
        count: Number(vendedor.qtd_cancelado) || 0,
        value: Number(vendedor.valor_cancelado) || 0,
      },
      {
        orderType: 'DEVOLVIDO',
        count: Number(vendedor.qtd_devolvido) || 0,
        value: Number(vendedor.valor_devolvido) || 0,
      },
      {
        orderType: 'RECUSADO',
        count: Number(vendedor.qtd_recusado) || 0,
        value: Number(vendedor.valor_recusado) || 0,
      },
      {
        orderType: 'REFATURAMENTO',
        count: Number(vendedor.qtd_refaturamento) || 0,
        value: Number(vendedor.valor_refaturamento) || 0,
      },
    ],
    orders: pedidos.map((pedido) => ({
      id: dashboard === 'vendas' ? Number(pedido.numero_pedido) : Number(pedido.numero_nf) || 0,
      date: dayjs(pedido.data_pedido).format('DD/MM/YYYY'),
      partner: pedido.nome_cliente ?? '—',
      value: Number(pedido.valor_pedido) || 0,
      category: resolveCategory(pedido.tipo_contrato),
      status: resolveStatus(pedido.situacao),
    })),
  };
}

const VendorDetailsModal = ({
  isOpen,
  onClose,
  vendorId,
  dashboard,
  mes,
  ano,
}: VendorDetailsModalProps) => {
  const [details, setDetails] = useState<VendorDetails | null>(null);
  const [selectedType, setSelectedType] = useState<OrderTypeKey | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTypeClick = (type: OrderTypeKey) => {
    setSelectedType((prev) => (prev === type ? null : type));
  };

  const filteredOrders =
    details?.orders.filter((order) => {
      if (!selectedType) return true;
      if (ORDER_CATEGORIES.includes(selectedType as OrderCategory)) {
        return order.category === selectedType;
      }
      return order.status === selectedType;
    }) ?? [];

  useEffect(() => {
    if (!isOpen || vendorId === null) return;
    async function loadVendorDetails() {
      try {
        setLoading(true);
        const getDetalheVendedor =
          dashboard === 'vendas' ? getDetalheVendedorVendas : getDetalheVendedorFaturamento;
        const res = await getDetalheVendedor({ cod_vendedor: String(vendorId), mes, ano });
        setDetails(mapVendorDetails(dashboard, res.vendedor, res.pedidos));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadVendorDetails();
  }, [isOpen, vendorId, dashboard, mes, ano]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do vendedor">
      {loading ? (
        <div className={styles.loading}>
          <CircularProgress size={50} />
          <span>Carregando...</span>
        </div>
      ) : (
        details && (
          <div className={styles.modalContent}>
            <div className={styles.vendorDetails}>
              <div className={styles.quickView}>
                <div className={styles.quickViewTitle}>
                  <Avatar name={details.name} size={50} />
                  <h3>{details.name}</h3>
                </div>
                <div className={styles.quickViewValues}>
                  <div>
                    <h4>Valor Total</h4>
                    <h3>{toBRL(details.totalValue)}</h3>
                  </div>
                  <div>
                    <h4>Total Pedidos</h4>
                    <h3>{details.totalOrders}</h3>
                  </div>
                </div>
              </div>
              <div className={styles.ordersTypesCount}>
                {details.orderTypes.map(({ orderType, count, value, cardType }) => (
                  <OrderType
                    key={orderType}
                    orderType={orderType}
                    count={count}
                    value={value}
                    cardType={cardType}
                    isActive={selectedType === orderType}
                    onClick={() => handleTypeClick(orderType)}
                  />
                ))}
              </div>
            </div>
            <div className={styles.allOrders}>
              {filteredOrders.map((order, i) => (
                <Order key={i} {...order} />
              ))}
            </div>
          </div>
        )
      )}
    </Modal>
  );
};

export default VendorDetailsModal;
