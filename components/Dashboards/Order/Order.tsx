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
  CANCELADOS: {
    default: 'var(--red)',
    light: 'var(--red-light)',
  },
  DEVOLVIDOS: {
    default: 'var(--blue)',
    light: 'var(--blue-light)',
  },
  RECUSADOS: {
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
  status?: 'CANCELADOS' | 'DEVOLVIDOS' | 'RECUSADOS' | 'REFATURAMENTO';
}

// "Sem classificação" não tem cor própria (usa --foreground) — como chip
// sólido isso vira texto branco em fundo branco no tema claro (ou preto em
// preto no escuro), então esse único caso ganha um chip neutro à parte.
function chipStyle(key: keyof typeof orderTypes) {
  if (key === 'SEM CLASSIFICAÇÃO') {
    return { backgroundColor: 'var(--card-bg-tertiary)', color: 'var(--foreground-secondary)' };
  }
  return { backgroundColor: orderTypes[key].default, color: 'var(--white)' };
}

const Order = ({ id, category, date, partner, value, status }: Order) => {
  const accentColor = orderTypes[status ? status : category].light;
  return (
    <div className={styles.order} style={{ borderLeftColor: accentColor }}>
      <div className={styles.orderHeader}>
        <span>#{id}</span>
        <span>{date}</span>
      </div>
      <div className={styles.orderPartner}>
        <span className={styles.orderPartnerLabel}>
          <GoPersonFill size={11} />
          Cliente
        </span>
        <h4>{partner}</h4>
      </div>
      <div className={styles.orderValues}>
        <span className={styles.orderTotalLabel}>Valor do pedido</span>
        <span className={styles.orderTotalValue}>{toBRL(value)}</span>
        <div className={styles.orderChips}>
          <span className={styles.chip} style={chipStyle(category)}>
            {category}
          </span>
          {status && (
            <span className={styles.chip} style={chipStyle(status)}>
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Order;
