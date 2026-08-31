import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import styles from './VendorCard.module.css';
import toBRL from '@/utils/toBRL';
import RankingBadge from './RankingBadge/RankingBadge';

// Posição da marca: 0 -> 0%, 100 -> 100%. Acima de 100% a marca fica
// travada no fim do card (não ultrapassa a borda).
function getMetaProgress(percMeta: number) {
  if (percMeta <= 0) return 0;
  return Math.min(percMeta, 100);
}

// Cor por nível de meta batida, reiniciando junto com o progresso a cada 100%.
function getMetaColor(percMeta: number) {
  if (percMeta <= 100) return 'var(--blue)';
  if (percMeta <= 200) return 'var(--green)';
  if (percMeta <= 300) return 'var(--orange)';
  if (percMeta <= 400) return 'var(--pink)';
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
  // A regra de cores por nível de meta (azul/verde/laranja/rosa/dourado) é
  // exclusiva do dashboard de Vendas. Fora dele, usa sempre a cor fixa (`color`).
  tieredMetaColor?: boolean;
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
  tieredMetaColor = false,
}: VendorCardProps) => {
  const metaColor = tieredMetaColor ? getMetaColor(Number(perc_meta) || 0) : color;
  const metaProgress = getMetaProgress(Number(perc_meta) || 0);
  return (
    <div className={styles.vendorCard} onClick={onClick}>
      <div
        className={styles.progressFill}
        style={{ width: `${metaProgress}%`, background: metaColor }}
      />
      <div
        className={styles.progressMarker}
        style={{ left: `${metaProgress}%`, background: metaColor }}
      />
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
        {/* Grade "rótulo: valor" — usada só no layout mobile (ver @media em VendorCard.module.css) */}
        <div className={styles.vendorDetailsMobile}>
          <span className={styles.vendorDetailItem}>
            <span className={styles.vendorDetailLabel}>{qtd_pedidos ? 'Pedidos: ' : 'NFs: '}</span>
            <span className={styles.vendorDetailValue}>{qtd_pedidos || total_nfs}</span>
          </span>
          <span className={styles.vendorDetailItem}>
            <span className={styles.vendorDetailLabel}>Meta: </span>
            <span className={styles.vendorDetailValue} style={{ color: metaColor }}>
              {`${perc_meta || 0}%`}
            </span>
          </span>
          <span className={styles.vendorDetailItem}>
            <span className={styles.vendorDetailLabel}>Part.: </span>
            <span className={styles.vendorDetailValue}>{`${perc_participacao || 0}%`}</span>
          </span>
          <span className={styles.vendorDetailItem}>
            <span className={styles.vendorDetailLabel}>Total: </span>
            <span className={styles.vendorDetailValue}>
              {faturamento ? toBRL(faturamento) : toBRL(vendas)}
            </span>
          </span>
        </div>
      </div>
      <div className={styles.vendorTotal}>{faturamento ? toBRL(faturamento) : toBRL(vendas)}</div>
    </div>
  );
};

export default VendorCard;
