import styles from './DashboardWidget.module.css';
type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type GridRows = 1 | 2 | 3 | 4 | 5 | 6;

interface DashboardWidgetProps {
    cols: GridCols,
    rows: GridRows,
    tabletCols?: GridCols,
    mobileCols?: GridCols,
    mobileOrder?: number,
    hideOnMobile?: boolean,
    children: React.ReactNode
}

const DashboardWidget = ({ children, cols, rows, tabletCols = cols, mobileCols = 12, mobileOrder, hideOnMobile }: DashboardWidgetProps) => {
    return (
        <div
            className={`${styles.widget}${hideOnMobile ? ` ${styles.hideOnMobile}` : ''}`}
            style={{
                ['--cols' as string]: cols,
                ['--rows' as string]: rows,
                ['--tablet-cols' as string]: tabletCols ?? cols,
                ['--mobile-cols' as string]: mobileCols ?? tabletCols ?? cols,
                ['--mobile-order' as string]: mobileOrder ?? 0,
            }}
        >
            {children}
        </div>
    )
};

export default DashboardWidget;