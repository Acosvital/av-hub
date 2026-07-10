'use client';
import { useEffect, useState } from 'react';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import styles from './styles.module.css';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import toBRL from '@/utils/toBRL';
import VendorDetailsModal from '@/components/Dashboards/VendorDetailsModal/VendorDetailsModal';
import useDashboardDate from '@/hooks/useDashboardDate';
import {
  getRankingVendedoresVendas,
  getRitmoMetaVendas,
  getVendaMensal,
} from '@/services/dashboardVendas';
import { RankingVendedoresVendasProps, RitmoMetaVendasProps, VendaMensalProps } from './types';
import { CircularProgress } from '@mui/material';

const Vendas = () => {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [rankingVendedores, setRankingVendedores] = useState<RankingVendedoresVendasProps[]>([]);
  const [vendaMensal, setVendaMensal] = useState<VendaMensalProps | null>(null);
  const [ritmoDeMeta, setRitmoDeMeta] = useState<RitmoMetaVendasProps | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const { completeDate } = useDashboardDate();
  const accentColor = 'var(--green)';

  const top3 = rankingVendedores.slice(0, 3);
  const otherVendors = rankingVendedores.slice(3);
  const gauge = Number(vendaMensal?.perc_atingimento);
  const scrollDuration = `${otherVendors.length * 1.7}s`;

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoading(true);
        const [ranking, vendas, ritmoVendas] = await Promise.all([
          getRankingVendedoresVendas({ mes: completeDate.month() + 1, ano: completeDate.year() }),
          getVendaMensal({ mes: completeDate.month() + 1, ano: completeDate.year() }),
          getRitmoMetaVendas({ mes: completeDate.month() + 1, ano: completeDate.year() }),
        ]);
        setRankingVendedores(ranking.data ?? []);
        setVendaMensal(vendas.data?.[0] ?? []);
        setRitmoDeMeta(ritmoVendas.data?.[0] ?? []);
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
            type="venda"
            value={gauge || 0}
            target={Number(vendaMensal?.meta) || 0}
            totalRevenue={Number(vendaMensal?.vendas_total) || 0}
            lastMonthRevenue={Number(vendaMensal?.vendas_mes_anterior) || 0}
            lastMonthOrders={Number(vendaMensal?.qtd_pedidos_mes_anterior) || 0}
            color={accentColor}
          />
        </DashboardWidget>
        {/* Ranking */}
        <DashboardWidget cols={6} rows={6}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
              <span>{loading ? 0 : rankingVendedores.length + 1} vendedores</span>
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
                    className={`${rankingVendedores.length > 9 && styles.autoScroll}`}
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
                      {rankingVendedores.length >= 10 &&
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
                  <span className={styles.billingValue}>
                    {toBRL(Number(vendaMensal?.vendas_hoje) || 0)}
                  </span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>
                    {toBRL(Number(vendaMensal?.vendas_ontem) || 0)}
                  </span>
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
                  <span className={styles.billingValue}>{vendaMensal?.pedidos_hoje || 0}</span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>{vendaMensal?.pedidos_ontem || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
        <DashboardWidget cols={6} rows={2}>
          <GoalPaceCard
            status={ritmoDeMeta?.status_ritmo === 'ABAIXO' ? 'below' : 'above'}
            idealDailyTarget={Number(ritmoDeMeta?.meta_diaria_ideal) || 0}
            currentDailyTarget={Number(ritmoDeMeta?.meta_diaria_atual) || 0}
            workingDays={Number(ritmoDeMeta?.dias_uteis_mes) || 0}
            elapsedDays={Number(ritmoDeMeta?.dias_uteis_decorridos) || 0}
          />
        </DashboardWidget>
      </DashboardGrid>
      <VendorDetailsModal
        isOpen={selectedVendorId !== null}
        onClose={() => setSelectedVendorId(null)}
        vendorId={selectedVendorId}
        dashboard="vendas"
        mes={completeDate.month() + 1}
        ano={completeDate.year()}
      />
    </div>
  );
};

export default Vendas;
