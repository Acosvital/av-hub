'use client';
import Modal from '@/components/Ui/Modal/Modal';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import OrderType from '@/components/Dashboards/OrderType/OrderType';
import Order from '@/components/Dashboards/Order/Order';
import toBRL from '@/utils/toBRL';
import styles from './VendorDetailsModal.module.css';

interface VendorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  totalValue: number;
  totalOrders: number;
}

type OrderCategory = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
type OrderStatus = 'CANCELADO' | 'DEVOLVIDO' | 'RECUSADO' | 'REFATURAMENTO';

interface MockOrder {
  id: number;
  date: string;
  partner: string;
  value: number;
  category: OrderCategory;
  status?: OrderStatus;
}

const orderTypeItems = [
  { orderType: 'SPOT' as const, count: 4859, value: 15269 },
  { orderType: 'CONTRATO' as const, count: 4859, value: 15269 },
  { orderType: 'SEM CLASSIFICAÇÃO' as const, count: 4859, value: 15269, cardType: 'double' as const },
  { orderType: 'CANCELADO' as const, count: 4859, value: 15269 },
  { orderType: 'DEVOLVIDO' as const, count: 4859, value: 15269 },
  { orderType: 'RECUSADO' as const, count: 4859, value: 15269 },
  { orderType: 'REFATURAMENTO' as const, count: 4859, value: 15269 },
];

const mockOrders: MockOrder[] = [
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'CANCELADO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'DEVOLVIDO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'RECUSADO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'REFATURAMENTO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'CONTRATO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SEM CLASSIFICAÇÃO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'CANCELADO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'DEVOLVIDO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'RECUSADO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT', status: 'REFATURAMENTO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'CONTRATO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SEM CLASSIFICAÇÃO' },
  { id: 24532, date: '10/06/2026', partner: 'MOSAIC FERTILIZANTES P&K LTDA.', value: 15210, category: 'SPOT' },
];

const VendorDetailsModal = ({ isOpen, onClose, vendorName, totalValue, totalOrders }: VendorDetailsModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title='Detalhes do vendedor'>
    <div className={styles.modalContent}>
      <div className={styles.vendorDetails}>
        <div className={styles.quickView}>
          <div className={styles.quickViewTitle}>
            <Avatar name={vendorName} size={50} />
            <h3>{vendorName}</h3>
          </div>
          <div className={styles.quickViewValues}>
            <div>
              <h4>Valor Total</h4>
              <h3>{toBRL(totalValue)}</h3>
            </div>
            <div>
              <h4>Total Pedidos</h4>
              <h3>{totalOrders}</h3>
            </div>
          </div>
        </div>
        <div className={styles.ordersTypesCount}>
          {orderTypeItems.map(({ orderType, count, value, cardType }) => (
            <OrderType
              key={orderType}
              orderType={orderType}
              count={count}
              value={value}
              cardType={cardType}
            />
          ))}
        </div>
      </div>
      <div className={styles.allOrders}>
        {mockOrders.map((order, i) => (
          <Order key={i} {...order} />
        ))}
      </div>
    </div>
  </Modal>
);

export default VendorDetailsModal;
