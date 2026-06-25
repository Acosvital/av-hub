import Gauge from '@/components/Charts/Gauge/Gauge';
import toBRL from '@/utils/toBRL';
import styles from './RevenueGauge.module.css';

interface RevenueGaugeProps {
  value: number;
  target: string;
  totalRevenue: number;
  lastMonthRevenue: number;
  lastMonthOrders: number;
  color?: string;
}

const RevenueGauge = ({
  value,
  target,
  totalRevenue,
  lastMonthRevenue,
  lastMonthOrders,
  color = 'var(--gold)',
}: RevenueGaugeProps) => {
  return (
    <div className={styles.gaugeContainer}>
      <Gauge size={250} value={value} color={color} />
      <div className={styles.totalRevenueValues}>
        <div>
          <h2 className={styles.defaultTitle}>faturamento total</h2>
          <h4 className={styles.revenueValue}>{toBRL(totalRevenue)}</h4>
        </div>
        <div>
          <h2 className={styles.defaultTitle}>Meta</h2>
          <h4 className={styles.meta} style={{ color: color, textShadow: `0 0 10px ${color}` }}>
            {target}
          </h4>
        </div>
      </div>
      <div className={styles.totalRevenueValues}>
        <div>
          <h2 className={styles.defaultSubtitle}>Mês Passado</h2>
          <h4 className={styles.secondarySubtitle}>{toBRL(lastMonthRevenue)}</h4>
        </div>
        <div>
          <h2 className={styles.defaultSubtitle}>Pedidos M. P.</h2>
          <h4 className={styles.secondarySubtitle}>{lastMonthOrders}</h4>
        </div>
      </div>
    </div>
  );
};

export default RevenueGauge;
