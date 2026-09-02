import { FaBoxesStacked, FaClockRotateLeft } from 'react-icons/fa6';
import Gauge from '@/components/Charts/Gauge/Gauge';
import toBRL from '@/utils/toBRL';
import styles from './RevenueGauge.module.css';

interface RevenueGaugeProps {
  totalOrders?: string;
  type?: 'venda' | 'faturamento';
  value: number;
  target: number;
  totalRevenue: number;
  lastMonthRevenue: number;
  lastMonthOrders: number;
  color?: string;
  gradientColor?: string;
}

const RevenueGauge = ({
  totalOrders,
  type = 'faturamento',
  value,
  target,
  totalRevenue,
  lastMonthRevenue,
  lastMonthOrders,
  color = 'var(--white)',
  gradientColor,
}: RevenueGaugeProps) => {
  const compactMeta = new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
  }).format(target);
  return (
    <div className={styles.gaugeContainer}>
      {totalOrders && (
        <h5 className={styles.totalOrders}>
          {type === 'faturamento' ? 'Total de NFs: ' : 'Total de Pedidos: '}
          {totalOrders}{' '}
        </h5>
      )}
      <Gauge size={240} value={value} color={color} gradientFrom={gradientColor} />
      <div className={styles.totalRevenueValues}>
        <div>
          <h2 className={`${styles.defaultTitle} sectionLabel`}>{type} total</h2>
          <h4 className={styles.revenueValue}>{toBRL(totalRevenue)}</h4>
        </div>
        <div>
          <h2 className={`${styles.defaultTitle} sectionLabel`}>Meta</h2>
          <h4 className={styles.meta} style={{ color }}>
            {compactMeta}
          </h4>
        </div>
      </div>
      <div className={styles.totalRevenueValues}>
        <div>
          <h2 className={`${styles.defaultSubtitle} sectionLabel`}>Mês Passado</h2>
          <h4 className={styles.secondarySubtitle}>
            <FaClockRotateLeft size={12} />
            {toBRL(lastMonthRevenue)}
          </h4>
        </div>
        <div>
          <h2 className={`${styles.defaultSubtitle} sectionLabel`}>Pedidos M. P.</h2>
          <h4 className={styles.secondarySubtitle}>
            <FaBoxesStacked size={12} />
            {lastMonthOrders}
          </h4>
        </div>
      </div>
    </div>
  );
};

export default RevenueGauge;
