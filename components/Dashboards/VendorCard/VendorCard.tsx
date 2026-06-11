import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import styles from './VendorCard.module.css';
import toBRL from '@/utils/toBRL';
import RankingBadge from './RankingBadge/RankingBadge';

interface VendorCardProps {
  name: string;
  orders: number;
  meta: number;
  participation: number;
  totalValue: number;
  rank: number;
  onClick: () => void;
}

const rankClass: Record<number, string> = {
    1: styles.gold,
    2: styles.silver,
    3: styles.bronze,
};

const VendorCard = ({ name, orders, meta, participation, totalValue, rank, onClick }: VendorCardProps) => {
  const colorClass = rankClass[rank] ?? styles.default;
  return (
    <div className={`${styles.vendorCard} ${colorClass}`} onClick={onClick}>
      <div className={styles.percentageEffect} style={{ width: `${participation}%` }} />
      <div className={styles.vendorRank}>
        <RankingBadge rank={rank} />
        <Avatar name={name} border={'var(--gold)'} size={50} />
      </div>
      <div className={styles.vendor}>
        <h4 className={styles.vendorName}>{name}</h4>
        <div className={styles.vendorDetails}>
          <span className={styles.vendorInfo}>{`${orders} pedidos`}</span>
          <span className={styles.vendorInfo}>{`${meta}% Meta`}</span>
          <span className={styles.vendorInfo}>{`${participation}% Part.`}</span>
        </div>
      </div>
      <div className={styles.vendorTotal}>
        {toBRL(totalValue)}
      </div>
    </div>
  )
};

export default VendorCard;