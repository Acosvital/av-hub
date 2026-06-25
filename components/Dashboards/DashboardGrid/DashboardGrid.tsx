import styles from './DashboardGrid.module.css';

interface DashboardGridProps {
  children: React.ReactNode;
}

const DashboardGrid = ({ children }: DashboardGridProps) => {
  return <div className={styles.dashboardGridLayout}>{children}</div>;
};

export default DashboardGrid;
