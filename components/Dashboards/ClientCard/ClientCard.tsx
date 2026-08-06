import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import styles from './ClientCard.module.css';
import RankingBadge from '../VendorCard/RankingBadge/RankingBadge';
import toBRL from '@/utils/toBRL';

export type ClientOrderType = 'SPOT' | 'CONTRATO' | 'SEM CLASSIFICAÇÃO';

const CLIENT_TYPE_COLORS: Record<ClientOrderType, string> = {
  SPOT: 'var(--green)',
  CONTRATO: 'var(--purple)',
  'SEM CLASSIFICAÇÃO': 'var(--gray-light)',
};

interface ClientCardProps {
  cliente: string;
  qtd_pedidos: number;
  perc_participacao: string;
  faturamento: number;
  tipo_contrato: ClientOrderType;
  posicao: string;
  color?: string;
}

const ClientCard = ({
  cliente,
  qtd_pedidos,
  perc_participacao,
  faturamento,
  tipo_contrato,
  posicao,
  color = 'var(--gold)',
}: ClientCardProps) => {
  const isPodium = Number(posicao) <= 3;
  const typeColor = CLIENT_TYPE_COLORS[tipo_contrato] ?? 'var(--foreground)';

  return (
    <div
      className={`${styles.clientCard} ${isPodium ? styles.podium : ''}`}
      style={{ '--row-color': typeColor } as React.CSSProperties}
    >
      <div className={styles.clientRank}>
        <RankingBadge rank={Number(posicao)} />
        <Avatar name={cliente} border={color} size={38} />
      </div>
      <div className={styles.client}>
        <h4 className={styles.clientName}>{cliente}</h4>
        <div className={styles.clientDetails}>
          <span className={styles.clientInfo}>{`${qtd_pedidos} Pedidos`}</span>
          <span className={styles.clientInfo}>·</span>
          <span className={styles.clientType} style={{ color: typeColor }}>
            {tipo_contrato}
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
