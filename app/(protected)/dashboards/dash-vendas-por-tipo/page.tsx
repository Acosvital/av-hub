'use client';
import { useEffect, useState } from 'react';
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
import {
  getRankingClientesVendas,
  getRankingVendedoresVendas,
  getRitmoMetaVendas,
  getVendaMensal,
  getVendasPorTipo,
} from '@/services/dashboardVendas';
import {
  ClientRankingVendasProps,
  RankingVendedoresVendasProps,
  RitmoMetaVendasProps,
  VendaMensalProps,
  VendasPorTipoProps,
} from './types';
import { Skeleton, useMediaQuery } from '@mui/material';
import ClientCard, { ClientOrderType } from '@/components/Dashboards/ClientCard/ClientCard';
import { chartsGridClasses, LineChart, PieChart } from '@mui/x-charts';

const TIPO_VENDA_DEFINITIONS: VendasPorTipoProps['tipo_contrato'][] = [
  'SPOT',
  'CONTRATO',
  'SEM CLASSIFICAÇÃO',
];

const BILLING_TYPE_COLORS: Record<string, string> = {
  SPOT: 'var(--green)',
  CONTRATO: 'var(--purple)',
  'SEM CLASSIFICAÇÃO': 'var(--white)',
};

const CLIENT_TYPE_FILTERS: ClientOrderType[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];

const MESES_FATURAMENTO_MENSAL = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];
const VENDAS_MENSAIS_SPOT = [2, 4, 6, 8, 10, 8, 6, 8, 6, 10, 12, 9];
const VENDAS_MENSAIS_CONTRATO = [12, 8, 5, 7, 4, 2, 10, 9, 11, 8, 10, 11];
const VENDAS_MENSAIS_SEM_CLASSIFICACAO = [2, 3, 4, 8.5, 1.5, 5, 1, 8, 8, 8, 9, 6];
const MAX_CLIENTES_RANKING_MOBILE = 15;

const VendasPorTipo = () => {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedFilialId, setSelectedFilialId] = useState<string | null>(null);
  const [rankingVendedores, setRankingVendedores] = useState<RankingVendedoresVendasProps[]>([]);
  const [vendaMensal, setVendaMensal] = useState<VendaMensalProps | null>(null);
  const [ritmoDeMeta, setRitmoDeMeta] = useState<RitmoMetaVendasProps | null>(null);
  const [vendasPorTipo, setVendasPorTipo] = useState<VendasPorTipoProps[]>([]);

  /* Segundo Dashboard*/
  const [selectedClientTypes, setSelectedClientTypes] = useState<ClientOrderType[]>([]);
  const [clientRankingData, setClientRankingData] = useState<ClientRankingVendasProps[]>([]);

  //só exibe o dashboard quando todas as requisições terminarem
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { completeDate } = useDashboardDate();
  const accentColor = 'var(--green)';
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const top3 = rankingVendedores.slice(0, 3);
  const otherVendors = rankingVendedores.slice(3);
  const gauge = Number(vendaMensal?.perc_atingimento);
  const scrollDuration = `${otherVendors.length * 1.7}s`;

  const vendasPorTipoPorLabel = new Map(vendasPorTipo.map((t) => [t.tipo_contrato, t]));
  const tiposVenda = TIPO_VENDA_DEFINITIONS.map((label) => ({
    label,
    value: Number(vendasPorTipoPorLabel.get(label)?.vendas) || 0,
  }));
  const totalVendaTipos = tiposVenda.reduce((sum, t) => sum + t.value, 0);

  /* Funções Cards Clientes*/
  // A API retorna uma linha por (cliente, tipo_contrato), então o mesmo cliente aparece
  // repetido quando tem vendas em mais de um tipo. Agrupamos por id_parceiro (não pelo nome,
  // já que clientes com o mesmo nome podem ser CNPJs/filiais diferentes) somando os tipos
  // relevantes ao filtro ativo.
  // A cor/degradê do card segue o filtro ativo (não os tipos que aquele cliente específico
  // teve vendas): nenhum ou os 3 selecionados -> degradê das 3 cores; 1 selecionado -> cor
  // sólida; 2 selecionados -> degradê das 2 cores.
  const activeClientTypes: ClientOrderType[] =
    selectedClientTypes.length > 0
      ? CLIENT_TYPE_FILTERS.filter((t) => selectedClientTypes.includes(t))
      : CLIENT_TYPE_FILTERS;

  const clientGroups = new Map<
    string,
    { cliente: string; faturamento: number; qtd_pedidos: number }
  >();
  clientRankingData
    .filter((c) => activeClientTypes.includes(c.tipo_contrato))
    .forEach((c) => {
      const group = clientGroups.get(c.id_parceiro) ?? {
        cliente: c.cliente,
        faturamento: 0,
        qtd_pedidos: 0,
      };
      group.faturamento += Number(c.vendas);
      group.qtd_pedidos += Number(c.qtd_pedidos);
      clientGroups.set(c.id_parceiro, group);
    });

  const totalClientRevenue = Array.from(clientGroups.values()).reduce(
    (sum, g) => sum + g.faturamento,
    0
  );
  const clientRankingFull = Array.from(clientGroups.entries())
    .sort((a, b) => b[1].faturamento - a[1].faturamento)
    .map(([id, group], i) => ({
      id,
      cliente: group.cliente,
      faturamento: group.faturamento,
      qtd_pedidos: group.qtd_pedidos,
      tipo_contrato: activeClientTypes.length > 1 ? activeClientTypes : activeClientTypes[0],
      posicao: String(i + 1),
      perc_participacao: totalClientRevenue
        ? ((group.faturamento / totalClientRevenue) * 100).toFixed(1)
        : '0',
    }));
  // No mobile o auto-scroll do ranking fica desativado (vira lista estática), então uma
  // lista com centenas de clientes fica cansativa de rolar manualmente.
  const clientRanking = isMobile
    ? clientRankingFull.slice(0, MAX_CLIENTES_RANKING_MOBILE)
    : clientRankingFull;
  const top3Clients = clientRanking.slice(0, 3);
  const otherClients = clientRanking.slice(3);
  const clientScrollDuration = `${otherClients.length * 1.7}s`;

  /* */
  const toggleClientType = (type: ClientOrderType) => {
    setSelectedClientTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  useEffect(() => {
    const params = { mes: completeDate.month() + 1, ano: completeDate.year() };

    async function loadAll() {
      setIsLoading(true);

      const results = await Promise.allSettled([
        getRankingVendedoresVendas(params),
        getVendaMensal(params),
        getRitmoMetaVendas(params),
        getVendasPorTipo(params),
        getRankingClientesVendas(params),
      ]);
      const [ranking, vendas, ritmoVendas, vendasTipo, rankingClientes] = results;

      if (ranking.status === 'fulfilled') setRankingVendedores(ranking.value.data ?? []);
      else console.error(ranking.reason);

      if (vendas.status === 'fulfilled') setVendaMensal(vendas.value.data?.[0] ?? null);
      else console.error(vendas.reason);

      if (ritmoVendas.status === 'fulfilled') setRitmoDeMeta(ritmoVendas.value.data?.[0] ?? null);
      else console.error(ritmoVendas.reason);

      if (vendasTipo.status === 'fulfilled') setVendasPorTipo(vendasTipo.value.data ?? []);
      else console.error(vendasTipo.reason);

      if (rankingClientes.status === 'fulfilled')
        setClientRankingData(rankingClientes.value.data ?? []);
      else console.error(rankingClientes.reason);

      setIsLoading(false);
    }

    loadAll();
  }, [completeDate]);

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
      <DashboardWidget cols={6} rows={3} tabletCols={12}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={6} rows={6} tabletCols={12}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={3} rows={2} tabletCols={6}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={3} rows={2} tabletCols={6}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={6} rows={1} tabletCols={12}>
        {skeletonWidget}
      </DashboardWidget>
    </DashboardGrid>
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

  const dashboardDetalhado = (
    <DashboardGrid>
      {/* Ranking Clientes */}
      <DashboardWidget cols={6} rows={6}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.rankingTitle}>🏆 Ranking Clientes</h2>
            <span>{clientRanking.length} clientes</span>
          </div>

          <div className={styles.fixedRank}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Destaques do Pódio
              <div className={styles.typeFilters}>
                {CLIENT_TYPE_FILTERS.map((type) => {
                  const isActive = selectedClientTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`${styles.typeFilterChip} ${isActive ? styles.typeFilterChipActive : ''}`}
                      style={{ '--chip-color': BILLING_TYPE_COLORS[type] } as React.CSSProperties}
                      onClick={() => toggleClientType(type)}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={styles.top3Container}>
              {top3Clients.map((c) => (
                <ClientCard key={c.id} {...c} color={accentColor} />
              ))}
            </div>
          </div>
          <div className={styles.defaultRank}>
            {/* Se o tamanho do Array dos clientes for menor que 8, não adicionar autoScroll - vai ficar estranho! */}
            <div
              className={otherClients.length > 9 ? styles.autoScroll : ''}
              style={{ '--scroll-duration': clientScrollDuration } as React.CSSProperties}
            >
              <div className={styles.vendorGroup}>
                {otherClients.map((c) => (
                  <ClientCard key={c.id} {...c} color={accentColor} />
                ))}
              </div>
              <div className={styles.vendorGroup} aria-hidden="true">
                {otherClients.length >= 10 &&
                  otherClients.map((c) => (
                    <ClientCard key={`dup-${c.id}`} {...c} color={accentColor} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardWidget>
      {/* Faturamento Mensal */}
      <DashboardWidget cols={6} rows={3}>
        <div className={styles.defaultCard}>
          <h3>Faturamento Mensal</h3>
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="lineAreaGradient-spot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineAreaGradient-contrato" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--purple)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--purple)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineAreaGradient-semclass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--white)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--white)" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
          <LineChart
            xAxis={[
              {
                scaleType: 'band',
                data: isMobile ? MESES_FATURAMENTO_MENSAL.slice(-6) : MESES_FATURAMENTO_MENSAL,
              },
            ]}
            series={[
              {
                id: 'SPOT',
                label: 'SPOT',
                data: isMobile ? VENDAS_MENSAIS_SPOT.slice(-6) : VENDAS_MENSAIS_SPOT,
                color: 'var(--green)',
                curve: 'natural',
                area: true,
              },
              {
                id: 'CONTRATO',
                label: 'CONTRATO',
                data: isMobile ? VENDAS_MENSAIS_CONTRATO.slice(-6) : VENDAS_MENSAIS_CONTRATO,
                color: 'var(--purple)',
                curve: 'natural',
                area: true,
              },
              {
                id: 'SEM CLASSIFICAÇÃO',
                label: 'SEM CLASSIFICAÇÃO',
                data: isMobile
                  ? VENDAS_MENSAIS_SEM_CLASSIFICACAO.slice(-6)
                  : VENDAS_MENSAIS_SEM_CLASSIFICACAO,
                color: 'var(--white)',
                curve: 'natural',
                area: true,
              },
            ]}
            margin={{ left: 0 }}
            height={260}
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
                textTransform: 'none',
              },
              '& .MuiLineChart-area[data-series="SPOT"]': {
                fill: 'url(#lineAreaGradient-spot)',
              },
              '& .MuiLineChart-area[data-series="CONTRATO"]': {
                fill: 'url(#lineAreaGradient-contrato)',
              },
              '& .MuiLineChart-area[data-series="SEM CLASSIFICAÇÃO"]': {
                fill: 'url(#lineAreaGradient-semclass)',
              },
            }}
          />
        </div>
      </DashboardWidget>
      {/* Faturamento por tipo */}
      <DashboardWidget cols={3} rows={3}>
        <div className={styles.defaultCard} style={{ backgroundColor: 'transparent' }}>
          <div className={styles.pieWrapper}>
            <div className={styles.pieTotal}>
              <span className={styles.tipoFaturamentoLabel}>Total Faturado por tipo</span>
              <span className={styles.tipoFaturamentoValue}>{toBRL(totalVendaTipos)}</span>
            </div>
            <PieChart
              series={[
                {
                  innerRadius: 50,
                  outerRadius: 100,
                  data: tiposVenda.map(({ label, value }) => ({
                    id: label,
                    value,
                    label,
                    color: BILLING_TYPE_COLORS[label] ?? 'var(--gray-light)',
                  })),

                  valueFormatter: ({ value }) => toBRL(value),
                  arcLabel: (item) =>
                    totalVendaTipos ? `${Math.round((item.value / totalVendaTipos) * 100)}%` : '',
                  arcLabelMinAngle: 15,
                },
              ]}
              slotProps={{
                legend: {
                  direction: 'horizontal',
                  position: { vertical: 'bottom', horizontal: 'center' },
                },
              }}
              sx={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                '& .MuiChartsArcLabel-root': {
                  fill: 'var(--navy-950)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 'var(--w-bold)',
                  fontSize: 'var(--fs-xs)',
                },
                '& .MuiChartsLegend-label': {
                  color: 'var(--foreground) !important',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 'var(--w-regular)',
                  textTransform: 'none',
                },
                gap: '3rem',
              }}
            />
          </div>
        </div>
      </DashboardWidget>
      {/* Situação */}
      <DashboardWidget cols={3} rows={3}>
        <div className={styles.defaultCard}>
          <h3>Situação</h3>
          <div className={styles.situationGroup}>
            {/* {situations.map(({ label, color, count, value }) => (
              <div
                key={label}
                className={styles.situationCard}
                style={{ '--situation-color': color } as React.CSSProperties}
              >
                <div>
                  <h4 className={styles.situationTitle}>{label}</h4>
                  <span>{count}</span>
                </div>
                <div>
                  <span>{toBRL(value)}</span>
                </div>
              </div>
            ))} */}
          </div>
        </div>
      </DashboardWidget>
    </DashboardGrid>
  );

  if (isLoading) {
    return <div className={styles.dashboardContainer}>{skeleton}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Adicionar ao array panels os dashboards desejados, que serão exibidos em sequência */}
      <DashboardScrollStack accentColor={accentColor} panels={[dashboard, dashboardDetalhado]} />
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

export default VendasPorTipo;
