'use client';
import { PieChart } from '@mui/x-charts';
import { useRef, useEffect, useState } from 'react';
import styles from './CommissionDonutChart.module.css';
import toBRL from '@/utils/toBRL';

export interface DonutItem {
  label: string;
  value: number;
  color: string;
}

interface CommissionDonutChartProps {
  data: DonutItem[];
  total: number;
}

const CommissionDonutChart = ({ data, total }: CommissionDonutChartProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 280, height: 280 });

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Comissões e Ajuda de Custo</h3>
      <div className={styles.chartWrapper} ref={wrapperRef}>
        <PieChart
          width={size.width}
          height={size.height}
          series={[{
            data: data.map((item, i) => ({
              id: i,
              value: item.value,
              label: item.label,
              color: item.color,
            })),
            innerRadius: '60%',
            outerRadius: '85%',
            paddingAngle: 2,
            cornerRadius: 4,
          }]}
          hideLegend={true}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <div className={styles.centerLabel}>
          <span className={styles.centerTitle}>Total Geral</span>
          <span className={styles.centerValue}>{toBRL(total)}</span>
        </div>
      </div>
      <div className={styles.legend}>
        {data.map((item) => (
          <div key={item.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
            <span className={styles.legendLabel}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommissionDonutChart;
