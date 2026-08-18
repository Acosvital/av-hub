import { FaArrowTrendDown, FaArrowTrendUp, FaRegCalendar } from 'react-icons/fa6';
import toBRL from '@/utils/toBRL';
import SectionCard from '../SectionCard/SectionCard';
import styles from './GoalPaceCard.module.css';

type GoalPaceStatus = 'above' | 'below';

interface GoalPaceCardProps {
  status: GoalPaceStatus;
  idealDailyTarget: number;
  currentDailyTarget: number;
  workingDays: number;
  elapsedDays: number;
  /** Direção dos dois blocos de meta. `column` (padrão) empilha, `row` coloca lado a lado. */
  orientation?: 'column' | 'row';
}

const GoalPaceCard = ({
  status,
  idealDailyTarget,
  currentDailyTarget,
  workingDays,
  elapsedDays,
  orientation = 'column',
}: GoalPaceCardProps) => {
  const isAbove = status === 'above';
  return (
    <SectionCard
      header={{
        title: 'Ritmo de meta',
        icon: <FaRegCalendar size={14} />,
        right: (
          <div className={`${styles.pill} ${isAbove ? styles.pillAbove : styles.pillBelow}`}>
            {isAbove ? <FaArrowTrendUp size={11} /> : <FaArrowTrendDown size={11} />}
            <span>{isAbove ? 'ACIMA' : 'ABAIXO'}</span>
          </div>
        ),
      }}
      background="var(--navy-850)"
    >
      <div
        className={`${styles.metaCards} ${orientation === 'row' ? styles.metaCardsRow : ''}`}
      >
        <div className={styles.metaCard}>
          <h4 className={styles.textSm}>Meta Diária Ideal</h4>
          <h3 className={styles.textLg}>{toBRL(idealDailyTarget)}</h3>
          <span className={styles.textXs}>· Base: {workingDays}D Úteis ·</span>
        </div>
        <div className={styles.metaCard}>
          <h4 className={styles.textSm}>Meta Diária Real</h4>
          <h3 className={`${styles.textLg} ${isAbove ? styles.textAbove : styles.textBelow}`}>
            {toBRL(currentDailyTarget)}
          </h3>
          <span className={styles.textXs}>· Base: {elapsedDays}D Decorridos ·</span>
        </div>
      </div>
    </SectionCard>
  );
};

export default GoalPaceCard;
