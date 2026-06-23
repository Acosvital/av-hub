'use client';
import { useState } from 'react';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import toBRL from '@/utils/toBRL';
import CommissionDonutChart, { DonutItem } from '@/components/Dashboards/CommissionDonutChart/CommissionDonutChart';
import CommissionRankingTable, { CommissionRow } from '@/components/Dashboards/CommissionRankingTable/CommissionRankingTable';
import CommissionDetailsModal from '@/components/Dashboards/CommissionDetailsModal/CommissionDetailsModal';

const kpiCards = [
  { label: 'Comissão Vendedores', value: 38024.41, color: 'var(--green-light)' },
  { label: 'Comissões Bloqueadas', value: 58604.79, color: 'var(--green)' },
  { label: 'Ajuda de Custo', value: 167000.01, color: 'var(--gold)' },
  { label: 'Comissão Gerência', value: 137578.06, color: 'var(--blue)' },
];

const donutData: DonutItem[] = [
  { label: 'Comissão Vendedores', value: 38024.41, color: 'var(--green-light)' },
  { label: 'Comissões Bloqueadas', value: 58604.79, color: 'var(--green)' },
  { label: 'Ajuda de Custo', value: 167000.01, color: 'var(--yellow)' },
  { label: 'Comissão Gerência', value: 137578.06, color: 'var(--blue)' },
];

const vendors: CommissionRow[] = [
  { rank: 1, name: 'EBER VIEIRA', faturado: 1344796.79, aFaturar: 1709432.50, ajudaCusto: 3500.00, comissao: 23620.27, bloqueado: 20666.29, total: 6453.98 },
  { rank: 2, name: 'JAMES MADSON OLIVEIRA DE SOUZA', faturado: 31055.51, aFaturar: 113437.12, ajudaCusto: 20000.00, comissao: 0, bloqueado: 0, total: 20000.00 },
  { rank: 3, name: 'SOFIA KAZUE', faturado: 669897.28, aFaturar: 49313.49, ajudaCusto: 3500.00, comissao: 13397.96, bloqueado: 12738.75, total: 4159.21 },
  { rank: 4, name: 'MARCELO AUGUSTO FERREIRA', faturado: 892450.00, aFaturar: 320150.75, ajudaCusto: 3500.00, comissao: 10245.80, bloqueado: 8900.00, total: 4845.80 },
  { rank: 5, name: 'FERNANDA LIMA SOUZA', faturado: 754320.60, aFaturar: 198760.30, ajudaCusto: 3500.00, comissao: 9100.45, bloqueado: 7650.20, total: 4950.25 },
  { rank: 6, name: 'PAULO ROBERTO SILVA', faturado: 628900.15, aFaturar: 412300.80, ajudaCusto: 3500.00, comissao: 8240.70, bloqueado: 5400.30, total: 6340.40 },
  { rank: 7, name: 'ANDREA MENDES COSTA', faturado: 521680.40, aFaturar: 289450.60, ajudaCusto: 3500.00, comissao: 7420.35, bloqueado: 4200.15, total: 6720.20 },
  { rank: 8, name: 'LUCAS PEREIRA ALMEIDA', faturado: 445230.75, aFaturar: 367890.20, ajudaCusto: 3500.00, comissao: 6980.90, bloqueado: 3150.45, total: 7330.45 },
  { rank: 9, name: 'GABRIEL DE DEUS NICOLAU', faturado: 1009538.75, aFaturar: 266057.33, ajudaCusto: 3500.00, comissao: 6919.84, bloqueado: 6578.93, total: 3840.91 },
  { rank: 10, name: 'CARLOS HENRIQUE', faturado: 0, aFaturar: 351632.28, ajudaCusto: 8000.00, comissao: 0, bloqueado: 0, total: 8000.00 },
  { rank: 11, name: 'RAUL MARTINS VENANCIO', faturado: 232972.28, aFaturar: 808965.37, ajudaCusto: 3500.00, comissao: 4422.34, bloqueado: 259.28, total: 7663.06 },
  { rank: 12, name: 'RODRIGO MIRANDA', faturado: 408296.38, aFaturar: 491203.31, ajudaCusto: 3500.00, comissao: 3748.95, bloqueado: 1004.17, total: 6244.78 },
  { rank: 13, name: 'RENAN MIRANDA', faturado: 172517.80, aFaturar: 51840.74, ajudaCusto: 3500.00, comissao: 3426.29, bloqueado: 607.90, total: 6318.39 },
  { rank: 14, name: 'JOARES ALVES', faturado: 598119.23, aFaturar: 365073.88, ajudaCusto: 3500.00, comissao: 3220.63, bloqueado: 1901.12, total: 4819.51 },
  { rank: 15, name: 'TIAGO VIANA', faturado: 90342.30, aFaturar: 866227.56, ajudaCusto: 3500.00, comissao: 1723.85, bloqueado: 23.85, total: 5200.00 },
  { rank: 16, name: 'MICHAEL JACKSON', faturado: 90342.30, aFaturar: 866227.56, ajudaCusto: 3500.00, comissao: 1723.85, bloqueado: 23.85, total: 5200.00 },
];

const managers: CommissionRow[] = [
  { rank: 1, name: 'EUVERALDO OLIVEIRA', faturado: 4850230.40, aFaturar: 2130450.80, ajudaCusto: 15000.00, comissao: 85420.30, bloqueado: 12300.00, total: 88120.30 },
  { rank: 2, name: 'SERGIO VITAL', faturado: 3920180.75, aFaturar: 1890320.60, ajudaCusto: 12000.00, comissao: 72350.60, bloqueado: 9800.00, total: 74550.60 },
  { rank: 3, name: 'JOÃO PEDRO', faturado: 3150640.30, aFaturar: 1620780.40, ajudaCusto: 10000.00, comissao: 61280.90, bloqueado: 8200.00, total: 63080.90 },
];

const total = kpiCards.reduce((sum, kpi) => sum + kpi.value, 0);

export default function Comissoes() {
  const [selectedVendor, setSelectedVendor] = useState<CommissionRow | null>(null);

  return (
    <div className={styles.dashboardContainer}>
      <DashboardGrid>
        <DashboardWidget cols={4} rows={2} mobileOrder={1}>
          <div className={styles.kpiGrid}>
            {kpiCards.map((kpi) => (
              <div key={kpi.label} className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{kpi.label}</span>
                <span className={styles.kpiValue} style={{ color: kpi.color }}>
                  {toBRL(kpi.value)}
                </span>
              </div>
            ))}
          </div>
        </DashboardWidget>
        <DashboardWidget cols={8} rows={6} mobileOrder={3}>
          <CommissionRankingTable
            vendors={vendors}
            managers={managers}
            onRowClick={setSelectedVendor}
          />
        </DashboardWidget>
        <DashboardWidget cols={4} rows={4} mobileOrder={2}>
          <CommissionDonutChart data={donutData} total={total} />
        </DashboardWidget>
      </DashboardGrid>
      <CommissionDetailsModal
        isOpen={selectedVendor !== null}
        onClose={() => setSelectedVendor(null)}
        vendor={selectedVendor}
      />
    </div>
  );
}
