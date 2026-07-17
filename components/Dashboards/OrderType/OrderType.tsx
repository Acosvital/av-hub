import styles from './OrderType.module.css';
import toBRL from '@/utils/toBRL';

const orderTypes = {
  SPOT: 'var(--green)',
  CONTRATO: 'var(--purple)',
  'SEM CLASSIFICAÇÃO': 'var(--foreground)',
  CANCELADOS: 'var(--red)',
  DEVOLVIDOS: 'var(--blue)',
  RECUSADOS: 'var(--yellow)',
  REFATURAMENTO: 'var(--orange)',
};

interface OrderTypeProps {
  orderType: keyof typeof orderTypes;
  count: number;
  value: number;
  cardType?: 'single' | 'double';
  isActive?: boolean;
  onClick?: () => void;
}

const OrderType = ({
  count,
  orderType,
  value,
  cardType = 'single',
  isActive,
  onClick,
}: OrderTypeProps) => {
  return (
    <div
      className={`${styles.orderTypeCard} ${cardType === 'double' ? styles.doubleCard : ''} ${isActive ? styles.activeCard : ''}`}
      onClick={onClick}
    >
      <div className={styles.typeCount}>
        <h4 style={{ color: orderTypes[orderType] }}>{orderType}</h4>
        <h4>{count}</h4>
      </div>
      <div className={styles.typeValue}>
        <h3>{toBRL(value)}</h3>
      </div>
    </div>
  );
};

export default OrderType;
