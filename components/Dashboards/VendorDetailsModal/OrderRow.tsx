import { GoPersonFill } from 'react-icons/go';
import styles from './OrderRow.module.css';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import orderTypes from '@/utils/orderTypeColors';
import { calcularSlaPedido, SlaTier } from '@/utils/slaPedido';
import { VendorOrder } from '@/services/dashboards/vendorDetailsMapper';

// Mesma leitura de urgência de "Meus Pedidos" (utils/slaPedido.ts) — texto
// simples, sem selo cheio, pra não brigar com a cor de fundo da linha.
const SLA_LABEL_COLOR: Record<SlaTier, string> = {
  atrasado: 'var(--red-light)',
  'vence-hoje': 'var(--red-light)',
  'falta-1-dia': 'var(--red-light)',
  'falta-2-dias': 'var(--red-light)',
  'falta-3-dias': 'var(--red-light)',
  normal: 'var(--foreground-secondary)',
};

// Destaque da LINHA inteira — mesma regra de "Meus Pedidos": atrasado só
// escurece (sem piscar), vence hoje pisca (mais urgente, ainda dá tempo
// hoje), 1-3 dias fica vermelho sem piscar, normal não ganha destaque.
const ROW_SLA_CLASS: Partial<Record<SlaTier, string>> = {
  atrasado: styles.rowAtrasado,
  'vence-hoje': styles.rowVenceHoje,
  'falta-1-dia': styles.rowVaiVencer,
  'falta-2-dias': styles.rowVaiVencer,
  'falta-3-dias': styles.rowVaiVencer,
};

// Selo translúcido (não mais preenchido/sólido) — a versão antiga (cor cheia
// + texto branco) sobrava contra o resto do vidro fosco do modal. Usa a
// variante "light" de cada categoria pra fundo/borda suaves e texto colorido,
// mesma fórmula do artifact aprovado (rgba fraco + borda rgba mais forte).
function chipStyle(key: keyof typeof orderTypes) {
  if (key === 'SEM CLASSIFICAÇÃO') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--foreground) 10%, transparent)',
      color: 'var(--foreground-secondary)',
      border: '1px solid color-mix(in srgb, var(--foreground) 20%, transparent)',
    };
  }
  const light = orderTypes[key].light;
  return {
    backgroundColor: `color-mix(in srgb, ${light} 18%, transparent)`,
    color: light,
    border: `1px solid color-mix(in srgb, ${light} 40%, transparent)`,
  };
}

const OrderRow = ({
  id,
  category,
  date,
  partner,
  value,
  status,
  previsaoFaturamento,
  faturado,
}: VendorOrder) => {
  const accentColor = orderTypes[status ? status : category].light;
  // previsaoFaturamento só existe quando o backend já expõe o campo (ver
  // docs/ENVIAR - contrato-sla-detalhe-vendedor.md) — até lá vem
  // undefined/null e a linha simplesmente não ganha nenhum selo de prazo.
  const sla = calcularSlaPedido(previsaoFaturamento ?? null, Boolean(faturado));
  const slaRowClass = sla ? (ROW_SLA_CLASS[sla.tier] ?? '') : '';

  return (
    <div
      className={`${styles.row} ${sla ? '' : styles.noSla} ${slaRowClass}`}
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      <div className={styles.rowTop}>
        <span className={styles.num}>#{id}</span>
        <span className={styles.date}>{date}</span>
      </div>

      <div className={styles.client}>
        <span className={styles.clientLabel}>
          <GoPersonFill size={10} />
          Cliente
        </span>
        <h4>{partner}</h4>
      </div>

      {sla && (
        <div className={styles.slaCol}>
          <span className={styles.previsaoLabel}>Previsão de faturamento</span>
          <span className={styles.slaData}>{previsaoFaturamento ? dateFormatter(previsaoFaturamento) : ''}</span>
          <span className={styles.slaTexto} style={{ color: SLA_LABEL_COLOR[sla.tier] }}>
            {sla.texto}
          </span>
        </div>
      )}

      <div className={styles.valueCol}>
        <span className={styles.valueLabel}>Valor do pedido</span>
        <span className={styles.value}>{toBRL(value)}</span>
        <div className={styles.tags}>
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

export default OrderRow;
