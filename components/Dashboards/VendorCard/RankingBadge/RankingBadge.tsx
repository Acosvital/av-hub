import styles from './RankingBadge.module.css';

interface RankingBadgeProps {
    rank: number;
}

const rankClass: Record<number, string> = {
    1: styles.gold,
    2: styles.silver,
    3: styles.bronze,
};

const RankingBadge = ({ rank }: RankingBadgeProps) => {
    const colorClass = rankClass[rank] ?? styles.default;

    return (
        <div className={`${styles.badge} ${colorClass}`}>
            {`${rank}º`}
        </div>
    );
};

export default RankingBadge;
