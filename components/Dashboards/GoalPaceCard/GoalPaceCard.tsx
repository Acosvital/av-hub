import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6';
import toBRL from '@/utils/toBRL';
import styles from './GoalPaceCard.module.css';

type GoalPaceStatus = 'above' | 'below';

interface GoalPaceCardProps {
  status: GoalPaceStatus;
  idealDailyTarget: number;
  currentDailyTarget: number;
  workingDays: number;
  elapsedDays: number;
}

const GoalPaceCard = ({
  status,
  idealDailyTarget,
  currentDailyTarget,
  workingDays,
  elapsedDays,
}: GoalPaceCardProps) => {
  const isAbove = status === 'above';
  return (
    <div className={styles.goalPaceContainer}>
      <div className={styles.sectionHeader}>
        <h4>Ritmo de meta</h4>
        <div className={`${styles.pill} ${isAbove ? styles.pillAbove : styles.pillBelow}`}>
          {isAbove ? <FaArrowTrendUp size={14} /> : <FaArrowTrendDown size={14} />}
          <span>{isAbove ? 'ACIMA' : 'ABAIXO'}</span>
        </div>
      </div>
      <div className={styles.metaCards}>
        <div className={styles.metaCard}>
          <h4 className={styles.textSm}>Meta Diária Ideal</h4>
          <h3 className={styles.textLg}>{toBRL(idealDailyTarget)}</h3>
          <span className={styles.textXs}>Base: {workingDays}D Úteis</span>
        </div>
        <div className={styles.metaCard}>
          <h4 className={styles.textSm}>Meta Diária Atual</h4>
          <h3 className={styles.textLg}>{toBRL(currentDailyTarget)}</h3>
          <span className={styles.textXs}>Base: {elapsedDays}D Decorridos</span>
        </div>
      </div>
    </div>
  );
};

export default GoalPaceCard;
