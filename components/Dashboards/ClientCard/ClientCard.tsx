import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import styles from './ClientCard.module.css';
import RankingBadge from '../VendorCard/RankingBadge/RankingBadge';
import toBRL from '@/utils/toBRL';

export type ClientOrderType = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';

const CLIENT_TYPE_COLORS: Record<ClientOrderType, string> = {
  SPOT: 'var(--fuchsia)',
  CONTRATO: 'var(--teal)',
  'SEM CLASSIFICAÇÃO': 'var(--gray-light)',
};

export interface ClientTypeBreakdown {
  tipo: ClientOrderType;
  valor: number;
}

interface ClientCardProps {
  cliente: string;
  qtd_pedidos: number;
  // "Pedidos" no ranking de vendas (qtd_pedidos de verdade); no de faturamento
  // o mesmo campo carrega total_nfs, então o rótulo vira "NFs" nesse contexto.
  unidadeLabel?: string;
  perc_participacao: string;
  faturamento: number;
  tipo_contrato?: ClientOrderType | ClientOrderType[];
  breakdown?: ClientTypeBreakdown[];
  posicao: string;
  color?: string;
}

const ClientCard = ({
  cliente,
  qtd_pedidos,
  unidadeLabel = 'Pedidos',
  perc_participacao,
  faturamento,
  tipo_contrato,
  breakdown = [],
  posicao,
  color = 'var(--gold)',
}: ClientCardProps) => {
  const tipos = tipo_contrato
    ? Array.isArray(tipo_contrato)
      ? tipo_contrato
      : [tipo_contrato]
    : [];
  const isComposite = tipos.length > 1;
  const typeColor =
    tipos.length > 0 ? (CLIENT_TYPE_COLORS[tipos[0]] ?? 'var(--foreground)') : color;

  // Divide a linha inteira do card entre os tipos de contrato do cliente,
  // proporcional ao faturamento de cada um — cores sólidas, sem degradê.
  const totalBreakdown = breakdown.reduce((sum, b) => sum + b.valor, 0);
  let acumulado = 0;
  const segments = totalBreakdown
    ? breakdown
        .filter((b) => b.valor > 0)
        .map((b) => {
          const largura = (b.valor / totalBreakdown) * 100;
          const inicio = acumulado;
          acumulado += largura;
          return { tipo: b.tipo, inicio, largura };
        })
    : [];

  return (
    <div className={styles.clientCard} style={{ '--row-color': typeColor } as React.CSSProperties}>
      {segments.map((s) => (
        <div
          key={s.tipo}
          className={styles.typeSegment}
          style={{
            left: `${s.inicio}%`,
            width: `${s.largura}%`,
            background: CLIENT_TYPE_COLORS[s.tipo],
          }}
        />
      ))}
      <div className={styles.clientRank}>
        <RankingBadge rank={Number(posicao)} />
        <Avatar name={cliente} border={color} size={38} />
      </div>
      <div className={styles.client}>
        <h4 className={styles.clientName}>{cliente}</h4>
        <div className={styles.clientDetails}>
          <span className={styles.clientInfo}>{`${qtd_pedidos} ${unidadeLabel}`}</span>
          <span className={styles.clientInfo}>·</span>
          <span
            className={styles.clientType}
            style={{ color: isComposite ? 'var(--foreground)' : typeColor }}
          >
            {tipos.join(' + ')}
          </span>
          <span className={styles.clientInfo}>·</span>
          <span className={styles.clientInfo}>{`${perc_participacao || 0}% Part.`}</span>
        </div>
      </div>
      <div className={styles.clientTotal}>{toBRL(faturamento)}</div>
    </div>
  );
};

export default ClientCard;
