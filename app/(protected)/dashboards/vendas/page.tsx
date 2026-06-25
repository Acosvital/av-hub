'use client';
import { useState } from 'react';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import styles from './styles.module.css';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import Card from '@/components/Ui/Card/Card';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import { useTheme } from 'next-themes';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import toBRL from '@/utils/toBRL';
import VendorDetailsModal from '@/components/Dashboards/VendorDetailsModal/VendorDetailsModal';

const mockVendors = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  name: 'HUGO DOS SANTOS GONÇALVES',
  orders: 100,
  meta: 10,
  participation: 100 - i * 1.9,
  totalValue: 3000450,
  rank: i + 1,
}));

const billingTypes = [
  { label: 'SPOT', value: 100136363.64 },
  { label: 'Contrato', value: 100136363.64 },
  { label: 'Sem Classificação', value: 100136363.64 },
];

const situations = [
  { label: 'Cancelados', count: 50, value: 100136363.64 },
  { label: 'Devolvidos', count: 50, value: 100136363.64 },
  { label: 'Recusados', count: 50, value: 100136363.64 },
  { label: 'Refaturamento', count: 50, value: 100136363.64 },
];

const Vendas = () => {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();
  const accentColor = 'var(--green)';

  const top3 = mockVendors.slice(0, 3);
  const otherVendors = mockVendors.slice(3);
  const scrollDuration = `${otherVendors.length * 1.7}s`;

  return (
    <div className={styles.dashboardContainer}>
      <DashboardGrid>
        {/* Gauge */}
        <DashboardWidget cols={6} rows={3}>
          <RevenueGauge
            value={85}
            target="40 MI"
            totalRevenue={23119350}
            lastMonthRevenue={23119350}
            lastMonthOrders={1029}
            color={accentColor}
          />
        </DashboardWidget>
        {/* Ranking */}
        <DashboardWidget cols={6} rows={6}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
              <span>37 vendedores</span>
            </div>
            <div className={styles.fixedRank}>
              Destaques do Pódio
              <div className={styles.top3Container}>
                {top3.map((v) => (
                  <VendorCard
                    key={v.id}
                    {...v}
                    onClick={() => setSelectedVendorId(v.id)}
                    color={accentColor}
                  />
                ))}
              </div>
            </div>
            <div className={styles.defaultRank}>
              {/* Se o tamanho do Array dos vendedores for menor que 8, não adicionar autoScroll - vai ficar estranho! */}
              <div
                className={`${mockVendors.length > 9 && styles.autoScroll}`}
                style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
              >
                <div className={styles.vendorGroup}>
                  {otherVendors.map((v) => (
                    <VendorCard
                      key={v.id}
                      {...v}
                      onClick={() => setSelectedVendorId(v.id)}
                      color={accentColor}
                    />
                  ))}
                </div>
                <div className={styles.vendorGroup} aria-hidden="true">
                  {mockVendors.length >= 10 &&
                    otherVendors.map((v) => (
                      <VendorCard
                        key={`dup-${v.id}`}
                        {...v}
                        onClick={() => setSelectedVendorId(v.id)}
                        color={accentColor}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={1}>
          <div className={styles.defaultCard}>
            <div>
              <h3>Venda Diária</h3>
              <div className={styles.billingCard}>
                <div>
                  <h4 className={styles.billingTitle}>Hoje</h4>
                  <span className={styles.billingValue}>{toBRL(100136363.64)}</span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>{toBRL(100136363.64)}</span>
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={3} rows={1}>
          <div className={styles.defaultCard}>
            <div>
              <h3>Volume de Pedidos</h3>
              <div className={styles.billingCard}>
                <div>
                  <h4 className={styles.billingTitle}>Hoje</h4>
                  <span className={styles.billingValue}>8400</span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>488</span>
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={6} rows={2}>
          <GoalPaceCard
            status="below"
            idealDailyTarget={1136363.64}
            currentDailyTarget={399468.64}
            workingDays={25}
            elapsedDays={3}
          />
        </DashboardWidget>
      </DashboardGrid>
      <VendorDetailsModal
        isOpen={selectedVendorId !== null}
        onClose={() => setSelectedVendorId(null)}
        vendorId={selectedVendorId}
      />
    </div>
  );
};

export default Vendas;
