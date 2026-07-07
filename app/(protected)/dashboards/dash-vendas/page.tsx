'use client';
import { useEffect, useState } from 'react';
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
import useDashboardDate from '@/hooks/useDashboardDate';
import { getRankingVendedores } from '@/services/dashboardFaturamento';
import { getRankingVendedoresVendas } from '@/services/dashboardVendas';
import { RankingVendedoresVendasProps } from './types';
import { CircularProgress } from '@mui/material';

const mockVendors = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  name: 'HUGO DOS SANTOS GONÇALVES',
  orders: 100,
  meta: 10,
  participation: 100 - i * 1.9,
  totalValue: 3000450,
  rank: i + 1,
}));

const Vendas = () => {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [rankingVendedores, setRankingVendedores] = useState<RankingVendedoresVendasProps[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const { completeDate } = useDashboardDate();
  const accentColor = 'var(--green)';

  const top3 = rankingVendedores.slice(0, 3);
  const otherVendors = rankingVendedores.slice(3);
  const scrollDuration = `${otherVendors.length * 1.7}s`;

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoading(true);
        const [ranking] = await Promise.all([
          getRankingVendedoresVendas({ mes: completeDate.month() + 1, ano: completeDate.year() }),
        ]);
        setRankingVendedores(ranking.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReferenceData();
  }, [completeDate]);

  return (
    <div className={styles.dashboardContainer}>
      <DashboardGrid>
        {/* Gauge */}
        <DashboardWidget cols={6} rows={3}>
          <RevenueGauge
            value={85}
            target={200000}
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
            {loading ? (
              <div className={styles.loading}>
                <CircularProgress size={50} />
                <span>Carregando...</span>
              </div>
            ) : (
              <>
                <div className={styles.fixedRank}>
                  Destaques do Pódio
                  <div className={styles.top3Container}>
                    {top3.map((v) => (
                      <VendorCard
                        key={Number(v.cod_vendedor)}
                        {...v}
                        onClick={() => setSelectedVendorId(Number(v.cod_vendedor))}
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
                          key={Number(v.cod_vendedor)}
                          {...v}
                          onClick={() => setSelectedVendorId(Number(v.cod_vendedor))}
                          color={accentColor}
                        />
                      ))}
                    </div>
                    <div className={styles.vendorGroup} aria-hidden="true">
                      {mockVendors.length >= 10 &&
                        otherVendors.map((v) => (
                          <VendorCard
                            key={`dup-${Number(v.cod_vendedor)}`}
                            {...v}
                            onClick={() => setSelectedVendorId(Number(v.cod_vendedor))}
                            color={accentColor}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </>
            )}
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
