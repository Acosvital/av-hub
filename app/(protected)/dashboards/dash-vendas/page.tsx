'use client';
import { startTransition, useCallback, useEffect, useState } from 'react';
import useAutoRefresh from '@/hooks/useAutoRefresh';
import DashboardHeroLayout from '@/components/Dashboards/DashboardHeroLayout/DashboardHeroLayout';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import DashboardScrollStack from '@/components/Dashboards/DashboardScrollStack/DashboardScrollStack';
import SectionCard from '@/components/Dashboards/SectionCard/SectionCard';
import DailyStatCard from '@/components/Dashboards/DailyStatCard/DailyStatCard';
import styles from './styles.module.css';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import toBRL from '@/utils/toBRL';
import VendorDetailsModal from '@/components/Dashboards/VendorDetailsModal/VendorDetailsModal';
import useDashboardDate from '@/hooks/useDashboardDate';
import useDashboardEmpresa from '@/hooks/useDashboardEmpresa';
import useDashboardVendorModal from '@/hooks/useDashboardVendorModal';
import useDashboardHistorico from '@/hooks/useDashboardHistorico';
import {
  getRankingVendedoresVendas,
  getRitmoMetaVendas,
  getVendaMensal,
  getVendasPorTipo,
  parseVendasPorTipoBuckets,
} from '@/services/dashboards/dashboardVendas';
import {
  RankingVendedoresVendasProps,
  RitmoMetaVendasProps,
  VendaMensalProps,
  VendasPorTipoProps,
} from './types';
import Card from '@/components/Ui/Card/Card';
import { Skeleton } from '@mui/material';

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

  //só exibe o dashboard quando todas as requisições terminarem
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { completeDate } = useDashboardDate();
  const { codigoEmpresa } = useDashboardEmpresa();
  const { vendorModalRequest, clearVendorModalRequest } = useDashboardVendorModal();
  const { isHistorico } = useDashboardHistorico();
  const accentColor = 'var(--green)';

  // Resultado da busca de pedido/NF no header abre o modal desse vendedor
  // diretamente aqui — a data/empresa já foram ajustadas pelo header.
  useEffect(() => {
    if (vendorModalRequest?.dashboard !== 'vendas') return;
    startTransition(() => {
      setSelectedVendorId(vendorModalRequest.vendorId);
      setSelectedFilialId(vendorModalRequest.filialId);
      clearVendorModalRequest();
    });
  }, [vendorModalRequest, clearVendorModalRequest]);

  const top3 = rankingVendedores.slice(0, 3);
  const otherVendors = rankingVendedores.slice(3);
  const gauge = Number(vendaMensal?.perc_atingimento);
  const scrollDuration = `${otherVendors.length * 3}s`;

  const vendasPorTipoPorLabel = new Map(vendasPorTipo.map((t) => [t.tipo_contrato, t]));
  const tiposVenda = TIPO_VENDA_DEFINITIONS.map((label) => ({
    label,
    value: Number(vendasPorTipoPorLabel.get(label)?.vendas) || 0,
  }));

  // silent=true (chamado pelo auto-refresh) não mexe no isLoading — sem
  // isso, o dashboard inteiro voltaria a mostrar skeleton a cada 1min.
  const loadAll = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);

      const params = {
        mes: completeDate.month() + 1,
        ano: completeDate.year(),
        codigo_empresa: codigoEmpresa ?? undefined,
        is_track_record: isHistorico,
      };

      const results = await Promise.allSettled([
        getRankingVendedoresVendas(params),
        getVendaMensal(params),
        getRitmoMetaVendas(params),
        getVendasPorTipo(params),
      ]);
      const [ranking, vendas, ritmoVendas, vendasTipo] = results;

      if (ranking.status === 'fulfilled') setRankingVendedores(ranking.value.data ?? []);
      else console.error(ranking.reason);

      if (vendas.status === 'fulfilled')
        setVendaMensal(vendas.value.consolidado ?? vendas.value.data?.[0] ?? null);
      else console.error(vendas.reason);

      if (ritmoVendas.status === 'fulfilled') setRitmoDeMeta(ritmoVendas.value.data?.[0] ?? null);
      else console.error(ritmoVendas.reason);

      if (vendasTipo.status === 'fulfilled') {
        const buckets = parseVendasPorTipoBuckets(vendasTipo.value.data);
        setVendasPorTipo(buckets[0]?.entries ?? []);
      } else console.error(vendasTipo.reason);

      if (!silent) setIsLoading(false);
    },
    [completeDate, codigoEmpresa, isHistorico]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca os dados da API (fonte externa) quando mês/empresa/histórico mudam
    loadAll();
  }, [loadAll]);

  // Mantém o dashboard atualizado sozinho (a cada 1min, pausado com a aba
  // em background) — ver hooks/useAutoRefresh.ts.
  useAutoRefresh(() => loadAll(true));

  const hero = (
    <RevenueGauge
      totalOrders={vendaMensal?.qtd_pedidos}
      type="venda"
      value={gauge || 0}
      target={Number(vendaMensal?.meta) || 0}
      totalRevenue={Number(vendaMensal?.vendas_total) || 0}
      lastMonthRevenue={Number(vendaMensal?.vendas_mes_anterior) || 0}
      lastMonthOrders={Number(vendaMensal?.qtd_pedidos_mes_anterior) || 0}
      color={accentColor}
      gradientColor="var(--blue)"
    />
  );

  const ranking = (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
        <span>{rankingVendedores.length} vendedores</span>
      </div>
      <div className={styles.fixedRank}>
        Destaques do Pódio
        <div className={styles.top3Container}>
          {top3.map((v) => (
            <VendorCard
              key={Number(v.cod_vendedor)}
              {...v}
              onClick={() => {
                setSelectedVendorId(Number(v.cod_vendedor));
                setSelectedFilialId(v.codigo_empresa);
              }}
              color={accentColor}
              tieredMetaColor
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
                onClick={() => {
                  setSelectedVendorId(Number(v.cod_vendedor));
                  setSelectedFilialId(v.codigo_empresa);
                }}
                color={accentColor}
                tieredMetaColor
              />
            ))}
          </div>
          <div className={styles.vendorGroup} aria-hidden="true">
            {rankingVendedores.length >= 10 &&
              otherVendors.map((v) => (
                <VendorCard
                  key={`dup-${Number(v.cod_vendedor)}`}
                  {...v}
                  onClick={() => {
                    setSelectedVendorId(Number(v.cod_vendedor));
                    setSelectedFilialId(v.codigo_empresa);
                  }}
                  color={accentColor}
                  tieredMetaColor
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const secondaryStats = (
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

  const secondaryPace = (
    <GoalPaceCard
      status={ritmoDeMeta?.status_ritmo === 'ABAIXO' ? 'below' : 'above'}
      idealDailyTarget={Number(ritmoDeMeta?.meta_diaria_ideal) || 0}
      currentDailyTarget={Number(ritmoDeMeta?.meta_diaria_atual) || 0}
      workingDays={Number(ritmoDeMeta?.dias_uteis_mes) || 0}
      elapsedDays={Number(ritmoDeMeta?.dias_uteis_decorridos) || 0}
    />
  );

  const tertiary = (
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

  const dashboard = (
    <DashboardHeroLayout
      hero={hero}
      ranking={ranking}
      secondaryStats={secondaryStats}
      secondaryPace={secondaryPace}
      tertiary={tertiary}
    />
  );

  const skeletonWidget = (
    <Skeleton
      variant="rounded"
      width="100%"
      height="100%"
      sx={{ bgcolor: 'var(--navy-850)', borderRadius: 'var(--radius-md)' }}
    />
  );

  const skeleton = (
    <DashboardGrid>
      <DashboardWidget cols={6} rows={3} tabletCols={12} mobileOrder={1} tabletOrder={1}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={6} rows={6} tabletCols={12} mobileOrder={5} tabletOrder={5}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={3} rows={2} tabletCols={6} mobileOrder={2} tabletOrder={2}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={3} rows={2} tabletCols={6} mobileOrder={3} tabletOrder={3}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={6} rows={1} tabletCols={12} mobileOrder={4} tabletOrder={4}>
        {skeletonWidget}
      </DashboardWidget>
    </DashboardGrid>
  );

  if (isLoading) {
    return <div className={styles.dashboardContainer}>{skeleton}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Adicionar ao array panels os dashboards desejados, que serão exibidos em sequência */}
      <DashboardScrollStack accentColor={accentColor} panels={[dashboard]} />
      <VendorDetailsModal
        isOpen={selectedVendorId !== null}
        filialId={selectedFilialId}
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
