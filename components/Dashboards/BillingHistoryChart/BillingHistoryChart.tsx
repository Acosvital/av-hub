'use client';
import { BarChart } from '@mui/x-charts';
import Card from '@/components/Ui/Card/Card';
import { dataset, valueFormatter } from './billingChartData';

const BillingHistoryChart = () => (
  <Card>
    <BarChart
      dataset={dataset}
      xAxis={[{ dataKey: 'mes' }]}
      yAxis={[{
        label: 'valor faturado',
        width: 70,
        valueFormatter: (value: number) => {
          const mi = value / 1_000_000;
          return `${Number.isInteger(mi) ? mi : mi.toFixed(1)} MI`;
        },
      }]}
      series={[{ dataKey: 'faturamento', label: 'Meses anteriores', valueFormatter }]}
      height={200}
      margin={{ left: 0 }}
    />
  </Card>
);

export default BillingHistoryChart;
