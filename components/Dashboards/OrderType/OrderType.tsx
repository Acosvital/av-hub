import styles from './OrderType.module.css';
import toBRL from '@/utils/toBRL';
import orderTypes from '@/utils/orderTypeColors';

interface OrderTypeProps {
  orderType: keyof typeof orderTypes;
  count: number;
  value: number;
  isActive?: boolean;
  onClick?: () => void;
}

const OrderType = ({ count, orderType, value, isActive, onClick }: OrderTypeProps) => {
  return (
    <div
      className={`${styles.orderTypeCard} ${isActive ? styles.activeCard : ''}`}
      onClick={onClick}
    >
      <div className={styles.typeTop}>
        <h4 className={styles.typeName} style={{ color: orderTypes[orderType].default }}>
          {orderType}
        </h4>
        <span className={styles.typeCount}>
          {count} {count === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>
      <h3 className={styles.typeValue}>{toBRL(value)}</h3>
    </div>
  );
};

export default OrderType;
