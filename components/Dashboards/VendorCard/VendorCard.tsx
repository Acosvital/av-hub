import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import styles from './VendorCard.module.css';
import toBRL from '@/utils/toBRL';
import RankingBadge from './RankingBadge/RankingBadge';

interface VendorCardProps {
  vendedor: string;
  qtd_pedidos: string;
  perc_meta: string;
  perc_participacao: string;
  faturamento: string;
  posicao: string;
  onClick: () => void;
  color?: string;
}

const rankClass: Record<number, string> = {
  1: styles.gold,
  2: styles.silver,
  3: styles.bronze,
};

const VendorCard = ({
  vendedor,
  qtd_pedidos,
  perc_meta,
  perc_participacao,
  faturamento,
  posicao,
  onClick,
  color = 'var(--gold)',
}: VendorCardProps) => {
  const colorClass = rankClass[Number(posicao)] ?? styles.default;
  return (
    <div className={`${styles.vendorCard} ${colorClass}`} onClick={onClick}>
      <div
        className={styles.percentageEffect}
        style={{
          width: `${perc_participacao}%`,
          borderRight: `3px solid ${color}`,
          boxShadow: `0 0 10px 1px ${color}`,
        }}
      />
      <div className={styles.vendorRank}>
        <RankingBadge rank={Number(posicao)} />
        <Avatar name={vendedor} border={`${color}`} size={50} />
      </div>
      <div className={styles.vendor}>
        <h4 className={styles.vendorName}>{vendedor}</h4>
        <div className={styles.vendorDetails}>
          <span className={styles.vendorInfo}>{`${qtd_pedidos || 0} pedidos`}</span>
          <span className={styles.vendorInfo}>{`${perc_meta || 0}% Meta`}</span>
          <span className={styles.vendorInfo}>{`${perc_participacao || 0}% Part.`}</span>
        </div>
      </div>
      <div className={styles.vendorTotal}>{toBRL(faturamento)}</div>
    </div>
  );
};

export default VendorCard;
