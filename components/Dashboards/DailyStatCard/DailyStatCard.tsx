import styles from './DailyStatCard.module.css';

interface DailyStatCardProps {
  todayLabel?: string;
  todayValue: React.ReactNode;
  yesterdayLabel?: string;
  yesterdayValue: React.ReactNode;
}

/**
 * Par "hoje / ontem" usado nos widgets de estatística diária dos
 * dashboards (venda diária, volume de pedidos, faturamento diário,
 * notas fiscais). Antes era CSS duplicado (`.billingCard`) em cada
 * página de dashboard.
 */
const DailyStatCard = ({
  todayLabel = 'Hoje',
  todayValue,
  yesterdayLabel = 'Ontem',
  yesterdayValue,
}: DailyStatCardProps) => {
  return (
    <div className={styles.dailyStatCard}>
      <div>
        <h4 className={styles.todayLabel}>{todayLabel}</h4>
        <span className={styles.todayValue}>{todayValue}</span>
      </div>
      <div>
        <h4 className={styles.yesterdayLabel}>{yesterdayLabel}</h4>
        <span className={styles.yesterdayValue}>{yesterdayValue}</span>
      </div>
    </div>
  );
};

export default DailyStatCard;
