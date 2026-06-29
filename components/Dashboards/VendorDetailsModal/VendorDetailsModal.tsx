'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Ui/Modal/Modal';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import OrderType from '@/components/Dashboards/OrderType/OrderType';
import Order from '@/components/Dashboards/Order/Order';
import toBRL from '@/utils/toBRL';
import styles from './VendorDetailsModal.module.css';

interface VendorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: number | null;
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

// TODO: remover quando o endpoint estiver disponível
const MOCK_DETAILS: VendorDetails = {
  name: 'HUGO DOS SANTOS GONÇALVES',
  totalValue: 2654843.16,
  totalOrders: 65,
  orderTypes: [
    { orderType: 'SPOT', count: 4859, value: 15269 },
    { orderType: 'CONTRATO', count: 4859, value: 15269 },
    { orderType: 'SEM CLASSIFICAÇÃO', count: 4859, value: 15269, cardType: 'double' },
    { orderType: 'CANCELADO', count: 4859, value: 15269 },
    { orderType: 'DEVOLVIDO', count: 4859, value: 15269 },
    { orderType: 'RECUSADO', count: 4859, value: 15269 },
    { orderType: 'REFATURAMENTO', count: 4859, value: 15269 },
  ],
  orders: [
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'CANCELADO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'DEVOLVIDO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'RECUSADO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'REFATURAMENTO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'CONTRATO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SEM CLASSIFICAÇÃO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'CANCELADO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'DEVOLVIDO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'RECUSADO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
      status: 'REFATURAMENTO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'CONTRATO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SEM CLASSIFICAÇÃO',
    },
    {
      id: 24532,
      date: '10/06/2026',
      partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
      value: 15210,
      category: 'SPOT',
    },
  ],
};

const ORDER_CATEGORIES: OrderCategory[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];

const VendorDetailsModal = ({ isOpen, onClose, vendorId }: VendorDetailsModalProps) => {
  const [details, setDetails] = useState<VendorDetails | null>(null);
  const [selectedType, setSelectedType] = useState<OrderTypeKey | null>(null);

  const handleTypeClick = (type: OrderTypeKey) => {
    setSelectedType(prev => (prev === type ? null : type));
  };

  const filteredOrders = details?.orders.filter(order => {
    if (!selectedType) return true;
    if (ORDER_CATEGORIES.includes(selectedType as OrderCategory)) {
      return order.category === selectedType;
    }
    return order.status === selectedType;
  }) ?? [];

  useEffect(() => {
    if (!isOpen || vendorId === null) return;
    // TODO: substituir pelo fetch real quando o endpoint estiver disponível
    // fetch(`/api/vendors/${vendorId}/details`)
    //   .then(res => res.json())
    //   .then(setDetails);
    Promise.resolve(MOCK_DETAILS).then(setDetails);
  }, [isOpen, vendorId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do vendedor">
      {details && (
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
      )}
    </Modal>
  );
};

export default VendorDetailsModal;
