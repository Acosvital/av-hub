'use client';
import { useEffect, useState } from 'react';
import DashboardHeroLayout from '@/components/Dashboards/DashboardHeroLayout/DashboardHeroLayout';
import SectionCard from '@/components/Dashboards/SectionCard/SectionCard';
import DailyStatCard from '@/components/Dashboards/DailyStatCard/DailyStatCard';
import styles from './styles.module.css';
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
  getVendasPorTipo,
} from '@/services/dashboardVendas';
import {
  RankingVendedoresVendasProps,
  RitmoMetaVendasProps,
  VendaMensalProps,
  VendasPorTipoProps,
} from './types';
import WidgetLoading from '@/components/Dashboards/WidgetLoading/WidgetLoading';

const TIPO_VENDA_DEFINITIONS: VendasPorTipoProps['tipo_contrato'][] = [
  'SPOT',
  'CONTRATO',
  'SEM CLASSIFICAÇÃO',
];

const Vendas = () => {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedFilialId, setSelectedFilialId] = useState<string | null>(null);
  const [rankingVendedores, setRankingVendedores] = useState<RankingVendedoresVendasProps[]>([]);
  const [vendaMensal, setVendaMensal] = useState<VendaMensalProps | null>(null);
  const [ritmoDeMeta, setRitmoDeMeta] = useState<RitmoMetaVendasProps | null>(null);
  const [vendasPorTipo, setVendasPorTipo] = useState<VendasPorTipoProps[]>([]);

  //loadings individuais para cada Widget
  const [loadingRanking, setLoadingRanking] = useState<boolean>(false);
  const [loadingVendaMensal, setLoadingVendaMensal] = useState<boolean>(false);
  const [loadingRitmoMeta, setLoadingRitmoMeta] = useState<boolean>(false);
  const [loadingVendasPorTipo, setLoadingVendasPorTipo] = useState<boolean>(false);
  const { completeDate } = useDashboardDate();
  const accentColor = 'var(--green)';

  const top3 = rankingVendedores.slice(0, 3);
  const otherVendors = rankingVendedores.slice(3);
  const gauge = Number(vendaMensal?.perc_atingimento);
  const scrollDuration = `${otherVendors.length * 1.7}s`;

  const vendasPorTipoPorLabel = new Map(vendasPorTipo.map((t) => [t.tipo_contrato, t]));
  const tiposVenda = TIPO_VENDA_DEFINITIONS.map((label) => ({
    label,
    value: Number(vendasPorTipoPorLabel.get(label)?.vendas) || 0,
  }));

  useEffect(() => {
    const params = { mes: completeDate.month() + 1, ano: completeDate.year() };

    async function loadRanking() {
      try {
        setLoadingRanking(true);
        const ranking = await getRankingVendedoresVendas(params);
        setRankingVendedores(ranking.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRanking(false);
      }
    }

    async function loadVendaMensal() {
      try {
        setLoadingVendaMensal(true);
        const vendas = await getVendaMensal(params);
        setVendaMensal(vendas.data?.[0] ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVendaMensal(false);
      }
    }

    async function loadRitmoMeta() {
      try {
        setLoadingRitmoMeta(true);
        const ritmoVendas = await getRitmoMetaVendas(params);
        setRitmoDeMeta(ritmoVendas.data?.[0] ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRitmoMeta(false);
      }
    }

    async function loadVendasPorTipo() {
      try {
        setLoadingVendasPorTipo(true);
        const vendasTipo = await getVendasPorTipo(params);
        setVendasPorTipo(vendasTipo.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVendasPorTipo(false);
      }
    }

    loadRanking();
    loadVendaMensal();
    loadRitmoMeta();
    loadVendasPorTipo();
  }, [completeDate]);

  const hero = loadingVendaMensal ? (
    <SectionCard>
      <WidgetLoading />
    </SectionCard>
  ) : (
    <RevenueGauge
      totalOrders={vendaMensal?.qtd_pedidos}
      type="venda"
      value={gauge || 0}
      target={Number(vendaMensal?.meta) || 0}
      totalRevenue={Number(vendaMensal?.vendas_total) || 0}
      lastMonthRevenue={Number(vendaMensal?.vendas_mes_anterior) || 0}
      lastMonthOrders={Number(vendaMensal?.qtd_pedidos_mes_anterior) || 0}
      color={accentColor}
    />
  );

  const ranking = (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
        <span>{loadingRanking ? 0 : rankingVendedores.length} vendedores</span>
      </div>
      {loadingRanking ? (
        <WidgetLoading />
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
              className={rankingVendedores.length > 9 ? styles.autoScroll : ''}
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
  );

  const secondaryStats = loadingVendaMensal ? (
    <div className={styles.stackedSections}>
      <SectionCard>
        <WidgetLoading />
      </SectionCard>
      <SectionCard>
        <WidgetLoading />
      </SectionCard>
    </div>
  ) : (
    <div className={styles.stackedSections}>
      <SectionCard
        header={{
          title: 'Venda Diária',
          icon: <span className={`${styles.titleDot} ${styles.dotGreen}`} />,
        }}
        background="var(--navy-850)"
      >
        <DailyStatCard
          todayValue={toBRL(Number(vendaMensal?.vendas_hoje) || 0)}
          yesterdayValue={toBRL(Number(vendaMensal?.vendas_ontem) || 0)}
        />
      </SectionCard>
      <SectionCard
        header={{
          title: 'Volume de Pedidos',
          icon: <span className={`${styles.titleDot} ${styles.dotBlue}`} />,
        }}
        background="var(--navy-850)"
      >
        <DailyStatCard
          todayValue={vendaMensal?.pedidos_hoje || 0}
          yesterdayValue={vendaMensal?.pedidos_ontem || 0}
        />
      </SectionCard>
    </div>
  );

  const secondaryPace = loadingRitmoMeta ? (
    <SectionCard>
      <WidgetLoading />
    </SectionCard>
  ) : (
    <GoalPaceCard
      status={ritmoDeMeta?.status_ritmo === 'ABAIXO' ? 'below' : 'above'}
      idealDailyTarget={Number(ritmoDeMeta?.meta_diaria_ideal) || 0}
      currentDailyTarget={Number(ritmoDeMeta?.meta_diaria_atual) || 0}
      workingDays={Number(ritmoDeMeta?.dias_uteis_mes) || 0}
      elapsedDays={Number(ritmoDeMeta?.dias_uteis_decorridos) || 0}
    />
  );

  const tertiary = loadingVendasPorTipo ? (
    <SectionCard background="var(--navy-850)">
      <WidgetLoading />
    </SectionCard>
  ) : (
    <SectionCard header={{ title: 'Vendas por Tipo' }} background="var(--navy-850)">
      <div className={styles.tipoVendaRow}>
        {tiposVenda.map((tipo) => (
          <div key={tipo.label} className={styles.tipoVendaItem}>
            <h4 className={styles.tipoVendaLabel}>{tipo.label}</h4>
            <span className={styles.tipoVendaValue}>{toBRL(tipo.value)}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );

  return (
    <div className={styles.dashboardContainer}>
      <DashboardHeroLayout
        hero={hero}
        ranking={ranking}
        secondaryStats={secondaryStats}
        secondaryPace={secondaryPace}
        tertiary={tertiary}
      />
      <VendorDetailsModal
        isOpen={selectedVendorId !== null}
        filialId={selectedFilialId} //Ajustar Endpoint e colocar id real
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
