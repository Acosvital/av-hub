'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Ui/Modal/Modal';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import Order from '@/components/Dashboards/Order/Order';
import toBRL from '@/utils/toBRL';
import styles from './CommissionDetailsModal.module.css';
import { CommissionRow } from '@/components/Dashboards/CommissionRankingTable/CommissionRankingTable';

interface CommissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: CommissionRow | null;
}

type OrderCategory = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
type OrderStatus = 'CANCELADOS' | 'DEVOLVIDOS' | 'RECUSADOS' | 'REFATURAMENTO';

interface VendorOrder {
  id: number;
  date: string;
  partner: string;
  value: number;
  category: OrderCategory;
  status?: OrderStatus;
}

// TODO: remover quando o endpoint estiver disponível
const MOCK_ORDERS: VendorOrder[] = [
  {
    id: 24532,
    date: '10/06/2026',
    partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
    value: 15210,
    category: 'SPOT',
  },
  {
    id: 24533,
    date: '11/06/2026',
    partner: 'NUTRIEN SOLUÇÕES AGRÍCOLAS LTDA.',
    value: 28450,
    category: 'CONTRATO',
  },
  {
    id: 24534,
    date: '12/06/2026',
    partner: 'YARA BRASIL FERTILIZANTES S.A.',
    value: 9800,
    category: 'SPOT',
    status: 'CANCELADOS',
  },
  {
    id: 24535,
    date: '13/06/2026',
    partner: 'BUNGE FERTILIZANTES S.A.',
    value: 42300,
    category: 'CONTRATO',
  },
  {
    id: 24536,
    date: '14/06/2026',
    partner: 'HERINGER FERTILIZANTES S.A.',
    value: 18750,
    category: 'SPOT',
    status: 'DEVOLVIDOS',
  },
  {
    id: 24537,
    date: '15/06/2026',
    partner: 'COAMO AGROINDUSTRIAL COOP.',
    value: 33600,
    category: 'SEM CLASSIFICAÇÃO',
  },
  {
    id: 24538,
    date: '16/06/2026',
    partner: 'AGROTERENAS AGROPECUÁRIA LTDA.',
    value: 22100,
    category: 'SPOT',
  },
  {
    id: 24539,
    date: '17/06/2026',
    partner: 'MOSAIC FERTILIZANTES P&K LTDA.',
    value: 15210,
    category: 'CONTRATO',
    status: 'REFATURAMENTO',
  },
  {
    id: 24540,
    date: '18/06/2026',
    partner: 'NUTRIEN SOLUÇÕES AGRÍCOLAS LTDA.',
    value: 11000,
    category: 'SPOT',
    status: 'RECUSADOS',
  },
  {
    id: 24541,
    date: '19/06/2026',
    partner: 'YARA BRASIL FERTILIZANTES S.A.',
    value: 56000,
    category: 'CONTRATO',
  },
];

const summaryCards = [
  { key: 'faturado' as const, label: 'Faturado', color: 'var(--green-light)' },
  { key: 'aFaturar' as const, label: 'A Faturar', color: 'var(--blue)' },
  { key: 'ajudaCusto' as const, label: 'Ajuda de Custo', color: 'var(--gold)' },
  { key: 'comissao' as const, label: 'Comissão', color: 'var(--green)' },
  { key: 'bloqueado' as const, label: 'Bloqueado', color: 'var(--red)' },
  { key: 'total' as const, label: 'Total', color: 'var(--purple)' },
];

const CommissionDetailsModal = ({ isOpen, onClose, vendor }: CommissionDetailsModalProps) => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);

  useEffect(() => {
    if (!isOpen || !vendor) return;
    // TODO: substituir pelo fetch real quando o endpoint estiver disponível
    // fetch(`/api/vendors/${vendor.rank}/commission-orders`)
    //   .then(res => res.json())
    //   .then(setOrders);
    Promise.resolve(MOCK_ORDERS).then(setOrders);
  }, [isOpen, vendor]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes de comissão">
      {vendor && (
        <div className={styles.modalContent}>
          <div className={styles.vendorDetails}>
            <div className={styles.quickView}>
              <div className={styles.quickViewTitle}>
                <Avatar name={vendor.name} size={50} />
                <h3>{vendor.name}</h3>
              </div>
              <div className={styles.quickViewValues}>
                <div>
                  <h4>Total</h4>
                  <h3 style={{ color: 'var(--purple)' }}>{toBRL(vendor.total)}</h3>
                </div>
                <div>
                  <h4>Comissão</h4>
                  <h3 style={{ color: 'var(--green)' }}>{toBRL(vendor.comissao)}</h3>
                </div>
              </div>
            </div>
            <div className={styles.summaryGrid}>
              {summaryCards.map(({ key, label, color }) => (
                <div key={key} className={styles.summaryCard}>
                  <span className={styles.summaryLabel} style={{ color }}>
                    {label}
                  </span>
                  <span className={styles.summaryValue}>{toBRL(vendor[key])}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.allOrders}>
            {orders.map((order, i) => (
              <Order key={i} {...order} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CommissionDetailsModal;
