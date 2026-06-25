import styles from './OrderType.module.css';
import toBRL from '@/utils/toBRL';

const orderTypes = {
  SPOT: 'var(--green)',
  CONTRATO: 'var(--purple)',
  'SEM CLASSIFICAÇÃO': 'var(--foreground)',
  CANCELADO: 'var(--red)',
  DEVOLVIDO: 'var(--blue)',
  RECUSADO: 'var(--yellow)',
  REFATURAMENTO: 'var(--orange)',
};

interface OrderTypeProps {
  orderType: keyof typeof orderTypes;
  count: number;
  value: number;
  cardType?: 'single' | 'double';
}

const OrderType = ({ count, orderType, value, cardType = 'single' }: OrderTypeProps) => {
  return (
    <div className={`${styles.orderTypeCard} ${cardType === 'double' && styles.doubleCard}`}>
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
