import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import styles from './VendorCard.module.css';
import toBRL from '@/utils/toBRL';
import RankingBadge from './RankingBadge/RankingBadge';

function getMetaColor(percMeta: number) {
  if (percMeta <= 100) return 'var(--foreground)';
  if (percMeta <= 200) return 'var(--blue)';
  if (percMeta <= 300) return 'var(--green)';
  if (percMeta <= 400) return 'var(--orange)';
  return 'var(--gold)';
}

interface VendorCardProps {
  vendedor: string;
  qtd_pedidos?: string;
  total_nfs?: string;
  perc_meta: string;
  perc_participacao: string;
  faturamento?: string;
  vendas?: string;
  posicao: string;
  onClick: () => void;
  color?: string;
}

const VendorCard = ({
  vendedor,
  qtd_pedidos,
  total_nfs,
  perc_meta,
  perc_participacao,
  faturamento,
  vendas,
  posicao,
  onClick,
  color = 'var(--gold)',
}: VendorCardProps) => {
  const isPodium = Number(posicao) <= 3;
  const metaColor = getMetaColor(Number(perc_meta) || 0);
  return (
    <div
      className={`${styles.vendorCard} ${isPodium ? styles.podium : ''}`}
      style={{ '--row-color': metaColor } as React.CSSProperties}
      onClick={onClick}
    >
      <div className={styles.vendorRank}>
        <RankingBadge rank={Number(posicao)} />
        <Avatar name={vendedor} border={`${color}`} size={38} />
      </div>
      <div className={styles.vendor}>
        <h4 className={styles.vendorName}>{vendedor}</h4>
        <div className={styles.vendorDetails}>
          <span
            className={styles.vendorInfo}
          >{`${qtd_pedidos ? qtd_pedidos + ' Pedidos' : total_nfs + ' NFs'}`}</span>
          <span className={styles.vendorInfo}>·</span>
          <span
            className={styles.vendorMeta}
            style={{ color: metaColor }}
          >{`${perc_meta || 0}% Meta`}</span>
          <span className={styles.vendorInfo}>·</span>
          <span className={styles.vendorInfo}>{`${perc_participacao || 0}% Part.`}</span>
        </div>
      </div>
      <div className={styles.vendorTotal}>{faturamento ? toBRL(faturamento) : toBRL(vendas)}</div>
    </div>
  );
};

export default VendorCard;
