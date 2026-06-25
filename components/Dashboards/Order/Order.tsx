import { GoPersonFill } from 'react-icons/go';
import styles from './Order.module.css';
import toBRL from '@/utils/toBRL';

const orderTypes = {
  SPOT: {
    default: 'var(--green)',
    light: 'var(--green-light)',
  },
  CONTRATO: {
    default: 'var(--purple)',
    light: 'var(--purple-light)',
  },
  'SEM CLASSIFICAÇÃO': {
    default: 'var(--foreground)',
    light: 'var(--foreground)',
  },
  CANCELADO: {
    default: 'var(--red)',
    light: 'var(--red-light)',
  },
  DEVOLVIDO: {
    default: 'var(--blue)',
    light: 'var(--blue-light)',
  },
  RECUSADO: {
    default: 'var(--yellow)',
    light: 'var(--yellow-light)',
  },
  REFATURAMENTO: {
    default: 'var(--orange)',
    light: 'var(--orange-light)',
  },
};

interface Order {
  id: number;
  date: string;
  partner: string;
  value: number;
  category: 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';
  status?: 'CANCELADO' | 'DEVOLVIDO' | 'RECUSADO' | 'REFATURAMENTO';
}

const Order = ({ id, category, date, partner, value, status }: Order) => {
  return (
    <div
      className={styles.order}
      style={{ border: `2px solid ${orderTypes[status ? status : category].light}` }}
    >
      <div
        className={styles.orderHeader}
        style={{ color: `${orderTypes[status ? status : category].light}` }}
      >
        <span>{id}</span>
        <span>{date}</span>
      </div>
      <div className={styles.orderPartner}>
        <span style={{ color: `${orderTypes[status ? status : category].default}` }}>
          <GoPersonFill size={12} />
          Cliente
        </span>
        <h4>{partner}</h4>
      </div>
      <div className={styles.orderValues}>
        <div className={styles.orderTotal}>
          <span style={{ color: `${orderTypes[status ? status : category].default}` }}>
            Valor do pedido
          </span>
          <h4 style={{ color: `${orderTypes[status ? status : category].light}` }}>
            {toBRL(value)}
          </h4>
        </div>
        <div className={styles.orderStatus}>
          <span style={{ color: `${orderTypes[category].light}` }}>{category}</span>
          {status && (
            <span
              className={styles.statusPill}
              style={{
                backgroundColor: `${orderTypes[status].default}`,
                color: `1px solid ${orderTypes[status].light}`,
              }}
            >
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Order;
