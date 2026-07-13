'use client';
import { BarChart } from '@mui/x-charts';
import { chartsGridClasses } from '@mui/x-charts/ChartsGrid';
import { BillingHistoryItem, valueFormatter } from './billingChartData';
import styles from './BillingHistoryChart.module.css';

interface BillingHistoryChartProps {
  dataset: BillingHistoryItem[];
  color: string;
}

const BillingHistoryChart = ({ dataset, color = 'var(--gold)' }: BillingHistoryChartProps) => (
  <div className={styles.defaultCard}>
    <h3>Histórico de faturamento</h3>
    <BarChart
      dataset={dataset}
      xAxis={[{ dataKey: 'mes' }]}
      yAxis={[
        {
          label: 'valor faturado',
          width: 70,
          tickMinStep: 10_000_000,
          valueFormatter: (value: number) => {
            const mi = value / 1_000_000;
            return `${Number.isInteger(mi) ? mi : mi.toFixed(1)} MI`;
          },
        },
      ]}
      series={[{ dataKey: 'faturamento', label: 'Últimos 6 meses', valueFormatter }]}
      colors={[color]}
      height={200}
      margin={{ left: 0 }}
      sx={{
        '& .MuiChartsAxis-line': {
          stroke: 'var(--border-strong) !important',
        },
        '& .MuiChartsAxis-tick': {
          stroke: 'var(--border-strong) !important',
        },
        '& .MuiChartsAxis-tickLabel': {
          fill: 'var(--foreground) !important',
        },
        '& .MuiChartsAxis-label': {
          fill: 'var(--foreground) !important',
        },
        [`& .${chartsGridClasses.line}`]: {
          stroke: 'var(--border)',
          strokeDasharray: '5 5',
        },
        '& .MuiChartsLegend-label': {
          color: 'var(--foreground) !important',
          fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--w-regular)',
        },
      }}
    />
  </div>
);

export default BillingHistoryChart;
