'use client';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import SectionCard from '@/components/Dashboards/SectionCard/SectionCard';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import ClientCard, { ClientOrderType } from '@/components/Dashboards/ClientCard/ClientCard';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import VendorDetailsModal from '@/components/Dashboards/VendorDetailsModal/VendorDetailsModal';
import DailyStatCard from '@/components/Dashboards/DailyStatCard/DailyStatCard';
import toBRL from '@/utils/toBRL';
import toCompactBRL from '@/utils/toCompactBRL';
import { useEffect, useState } from 'react';
import {
  ClientRankingFaturamentoProps,
  FaturamentoMensalProps,
  FaturamentoPorTipoProps,
  RitmoMetaFaturamentoProps,
  SellerRankingProps,
  SituacaoPedidosFaturadosProps,
} from './types';
import {
  FaturamentoPorTipoBucket,
  getFaturamentoMensal,
  getFaturamentoPorTipo,
  getRankingClientesFaturamento,
  getRankingVendedores,
  getRitmoMetaFaturamento,
  getSituacaoPedidos,
  parseFaturamentoPorTipoBuckets,
} from '@/services/dashboards/dashboardFaturamento';
import useDashboardDate from '@/hooks/useDashboardDate';
import DashboardScrollStack from '@/components/Dashboards/DashboardScrollStack/DashboardScrollStack';
import { LineChart, PieChart } from '@mui/x-charts';
import { chartsGridClasses } from '@mui/x-charts/ChartsGrid';
import { Skeleton, useMediaQuery } from '@mui/material';

const SITUACAO_DEFINITIONS = [
  { id: 'G1', label: 'Cancelados', color: 'var(--red)' },
  { id: 'G2', label: 'Devolvidos', color: 'var(--blue)' },
  { id: 'G3', label: 'Recusados', color: 'var(--yellow)' },
  { id: 'G6', label: 'Refaturamento', color: 'var(--orange)' },
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
const TIPO_FATURAMENTO_DEFINITIONS: FaturamentoPorTipoProps['tipo_contrato'][] = [
  'SPOT',
  'CONTRATO',
  'SEM CLASSIFICAÇÃO',
];
const MAX_MESES_FATURAMENTO_MENSAL = 12;
const MAX_CLIENTES_RANKING_MOBILE = 15;

const labelMesAno = (mes: number, ano: number) =>
  `${MESES_FATURAMENTO_MENSAL[mes - 1]}/${String(ano).slice(-2)}`;

export default function FaturamentoPorTipo() {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedFilialId, setSelectedFilialId] = useState<string | null>(null);
  const [sellerRanking, setSellerRanking] = useState<SellerRankingProps[]>([]);
  const [faturamentoMensal, setFaturamentoMensal] = useState<FaturamentoMensalProps | null>(null);
  const [faturamentoPorTipoBuckets, setFaturamentoPorTipoBuckets] = useState<
    FaturamentoPorTipoBucket[]
  >([]);
  const [ritmoDeMeta, setRitmoDeMeta] = useState<RitmoMetaFaturamentoProps | null>(null);
  const [situacaoPedidos, setSituacaoPedidos] = useState<SituacaoPedidosFaturadosProps[]>([]);
  const [selectedClientTypes, setSelectedClientTypes] = useState<ClientOrderType[]>([]);
  const [clientRankingData, setClientRankingData] = useState<ClientRankingFaturamentoProps[]>([]);

  //só exibe o dashboard quando todas as requisições terminarem
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { completeDate } = useDashboardDate();
  const accentColor = 'var(--gold)';
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const top3 = sellerRanking.slice(0, 3);
  const otherVendors = sellerRanking.slice(3);
  const scrollDuration = `${otherVendors.length * 1.7}s`;
  const gauge = Number(faturamentoMensal?.perc_atingimento);

  const anchorMes = completeDate.month() + 1;
  const anchorAno = completeDate.year();
  const anchorKey = anchorAno * 12 + anchorMes;

  const faturamentoPorTipoMesAtual =
    faturamentoPorTipoBuckets.find((b) => b.ano * 12 + b.mes === anchorKey)?.entries ?? [];
  const ultimos12MesesFaturamento = faturamentoPorTipoBuckets
    .filter((b) => b.ano * 12 + b.mes <= anchorKey)
    .slice(-MAX_MESES_FATURAMENTO_MENSAL);

  const faturamentoPorTipoPorLabel = new Map(
    faturamentoPorTipoMesAtual.map((t) => [t.tipo_contrato, t])
  );
  const billingTypes = TIPO_FATURAMENTO_DEFINITIONS.map((label) => ({
    label,
    value: Number(faturamentoPorTipoPorLabel.get(label)?.faturamento) || 0,
  }));
  const totalBillingTypes = billingTypes.reduce((sum, t) => sum + t.value, 0);

  const faturamentoMensalLabels = ultimos12MesesFaturamento.map((b) => labelMesAno(b.mes, b.ano));
  const faturamentoMensalPorTipo = TIPO_FATURAMENTO_DEFINITIONS.reduce<Record<string, number[]>>(
    (acc, tipo) => {
      acc[tipo] = ultimos12MesesFaturamento.map(
        (b) => Number(b.entries.find((e) => e.tipo_contrato === tipo)?.faturamento) || 0
      );
      return acc;
    },
    {}
  );

  const situacaoPorGrupo = new Map(situacaoPedidos.map((s) => [s.grupo_deducao, s]));
  const situations = SITUACAO_DEFINITIONS.map(({ id, label, color }) => {
    const situacao = situacaoPorGrupo.get(id);
    return {
      id,
      label,
      color,
      count: Number(situacao?.qtd_nfs) || 0,
      value: Number(situacao?.valor_total) || 0,
    };
  });
  const toggleClientType = (type: ClientOrderType) => {
    setSelectedClientTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // A API retorna uma linha por (cliente, tipo_contrato), então o mesmo cliente aparece
  // repetido quando tem faturamento em mais de um tipo. Agrupamos por id_parceiro (não pelo
  // nome, já que clientes com o mesmo nome podem ser CNPJs/filiais diferentes) somando os
  // tipos relevantes ao filtro ativo.
  // A cor/degradê do card segue o filtro ativo (não os tipos que aquele cliente específico
  // teve faturamento): nenhum ou os 3 selecionados -> degradê das 3 cores; 1 selecionado ->
  // cor sólida; 2 selecionados -> degradê das 2 cores.
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
      group.faturamento += Number(c.faturamento);
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
  // lista grande de clientes fica cansativa de rolar manualmente.
  const clientRanking = isMobile
    ? clientRankingFull.slice(0, MAX_CLIENTES_RANKING_MOBILE)
    : clientRankingFull;
  const top3Clients = clientRanking.slice(0, 3);
  const otherClients = clientRanking.slice(3);
  const clientScrollDuration = `${otherClients.length * 1.7}s`;

  //Carrega os dados do dashboard a partir do filtro de data
  useEffect(() => {
    const params = { mes: completeDate.month() + 1, ano: completeDate.year() };

    async function loadAll() {
      setIsLoading(true);

      const results = await Promise.allSettled([
        getRankingVendedores(params),
        getFaturamentoMensal(params),
        // Sem mes/ano o endpoint retorna todo o período, necessário para os últimos 12 meses do LineChart.
        getFaturamentoPorTipo(),
        getRitmoMetaFaturamento(params),
        getSituacaoPedidos(params),
        getRankingClientesFaturamento(params),
      ]);
      const [ranking, faturamento, faturamentoTipos, ritmoMeta, situacaoPedidosRes, rankingClientes] =
        results;

      if (ranking.status === 'fulfilled') setSellerRanking(ranking.value.data ?? []);
      else console.error(ranking.reason);

      if (faturamento.status === 'fulfilled')
        setFaturamentoMensal(faturamento.value.data?.[0] ?? null);
      else console.error(faturamento.reason);

      if (faturamentoTipos.status === 'fulfilled')
        setFaturamentoPorTipoBuckets(parseFaturamentoPorTipoBuckets(faturamentoTipos.value.data));
      else console.error(faturamentoTipos.reason);

      if (ritmoMeta.status === 'fulfilled') setRitmoDeMeta(ritmoMeta.value.data?.[0] ?? null);
      else console.error(ritmoMeta.reason);

      if (situacaoPedidosRes.status === 'fulfilled')
        setSituacaoPedidos(situacaoPedidosRes.value.data ?? []);
      else console.error(situacaoPedidosRes.reason);

      if (rankingClientes.status === 'fulfilled')
        setClientRankingData(rankingClientes.value.data ?? []);
      else console.error(rankingClientes.reason);

      setIsLoading(false);
    }

    loadAll();
  }, [completeDate]);

  const faturamento = (
    <DashboardGrid>
      {/* Ranking */}
      <DashboardWidget cols={6} rows={6} tabletCols={12}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
            <span>{sellerRanking.length} vendedores</span>
          </div>
          <div className={styles.fixedRank}>
            Destaques do Pódio
            <div className={styles.top3Container}>
              {top3.map((v) => (
                <VendorCard
                  key={v.cod_vendedor}
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
              className={sellerRanking.length > 9 ? styles.autoScroll : ''}
              style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
            >
              <div className={styles.vendorGroup}>
                {otherVendors.map((v) => (
                  <VendorCard
                    key={v.cod_vendedor}
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
                {sellerRanking.length >= 10 &&
                  otherVendors.map((v) => (
                    <VendorCard
                      key={`dup-${v.cod_vendedor}`}
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
      </DashboardWidget>
      {/* Gauge */}
      <DashboardWidget cols={6} rows={3} tabletCols={12}>
        <RevenueGauge
          totalOrders={faturamentoMensal?.qtd_nfs}
          value={gauge || 0}
          target={Number(faturamentoMensal?.meta) || 0}
          totalRevenue={Number(faturamentoMensal?.faturamento_total) || 0}
          lastMonthRevenue={Number(faturamentoMensal?.fat_mes_anterior) || 0}
          lastMonthOrders={Number(faturamentoMensal?.qtd_nfs_mes_anterior) || 0}
          color={accentColor}
        />
      </DashboardWidget>
      {/* Faturamento Diário / Volume NFs */}
      <DashboardWidget cols={3} rows={2} tabletCols={6}>
        <div className={styles.stackedSections}>
          <SectionCard
            header={{
              title: 'Faturamento Diário',
              icon: <span className={`${styles.titleDot} ${styles.dotGold}`} />,
            }}
            background="var(--navy-850)"
          >
            <DailyStatCard
              todayValue={toBRL(Number(faturamentoMensal?.fat_hoje) || 0)}
              yesterdayValue={toBRL(Number(faturamentoMensal?.fat_ontem) || 0)}
            />
          </SectionCard>
          <SectionCard
            header={{
              title: 'Volume de Notas Fiscais',
              icon: <span className={`${styles.titleDot} ${styles.dotGold}`} />,
            }}
            background="var(--navy-850)"
          >
            <DailyStatCard
              todayValue={faturamentoMensal?.pedidos_hoje || 0}
              yesterdayValue={faturamentoMensal?.pedidos_ontem || 0}
            />
          </SectionCard>
        </div>
      </DashboardWidget>
      {/* Ritmo de meta */}
      <DashboardWidget cols={3} rows={2} tabletCols={6}>
        <GoalPaceCard
          status={ritmoDeMeta?.status_ritmo === 'ABAIXO' ? 'below' : 'above'}
          idealDailyTarget={Number(ritmoDeMeta?.meta_diaria_ideal) || 0}
          currentDailyTarget={Number(ritmoDeMeta?.meta_diaria_atual) || 0}
          workingDays={Number(ritmoDeMeta?.dias_uteis_mes) || 0}
          elapsedDays={Number(ritmoDeMeta?.dias_uteis_decorridos) || 0}
          orientation="column"
        />
      </DashboardWidget>
      {/* Faturamento por tipo */}
      <DashboardWidget cols={6} rows={1} tabletCols={12}>
        <div className={styles.defaultCard}>
          <h3>Faturamento por tipo</h3>
          <div className={styles.tipoFaturamentoRow}>
            {billingTypes.map(({ label, value }) => (
              <div key={label} className={styles.tipoFaturamentoItem}>
                <h4 className={styles.tipoFaturamentoLabel}>{label}</h4>
                <span className={styles.tipoFaturamentoValue}>{toBRL(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </DashboardWidget>
    </DashboardGrid>
  );

  const faturamentoDetalhado = (
    <DashboardGrid>
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
                data: isMobile ? faturamentoMensalLabels.slice(-6) : faturamentoMensalLabels,
              },
            ]}
            yAxis={[
              {
                width: 64,
                valueFormatter: (value: number) => toCompactBRL(value),
              },
            ]}
            series={[
              {
                id: 'SPOT',
                label: 'SPOT',
                data: isMobile
                  ? faturamentoMensalPorTipo.SPOT.slice(-6)
                  : faturamentoMensalPorTipo.SPOT,
                color: 'var(--green)',
                curve: 'natural',
                area: true,
                valueFormatter: (value: number | null) => toBRL(value),
              },
              {
                id: 'CONTRATO',
                label: 'CONTRATO',
                data: isMobile
                  ? faturamentoMensalPorTipo.CONTRATO.slice(-6)
                  : faturamentoMensalPorTipo.CONTRATO,
                color: 'var(--purple)',
                curve: 'natural',
                area: true,
                valueFormatter: (value: number | null) => toBRL(value),
              },
              {
                id: 'SEM CLASSIFICAÇÃO',
                label: 'SEM CLASSIFICAÇÃO',
                data: isMobile
                  ? faturamentoMensalPorTipo['SEM CLASSIFICAÇÃO'].slice(-6)
                  : faturamentoMensalPorTipo['SEM CLASSIFICAÇÃO'],
                color: 'var(--white)',
                curve: 'natural',
                area: true,
                valueFormatter: (value: number | null) => toBRL(value),
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
      {/* Situação */}
      <DashboardWidget cols={3} rows={3}>
        <div className={styles.defaultCard}>
          <h3>Situação</h3>
          <div className={styles.situationGroup}>
            {situations.map(({ label, color, count, value }) => (
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
            ))}
          </div>
        </div>
      </DashboardWidget>
      {/* Faturamento por tipo */}
      <DashboardWidget cols={3} rows={3}>
        <div className={styles.defaultCard} style={{ backgroundColor: 'transparent' }}>
          <div className={styles.pieWrapper}>
            <div className={styles.pieTotal}>
              <span className={styles.tipoFaturamentoLabel}>Total Faturado por tipo</span>
              <span className={styles.tipoFaturamentoValue}>{toBRL(totalBillingTypes)}</span>
            </div>
            <PieChart
              series={[
                {
                  innerRadius: 50,
                  outerRadius: 100,
                  data: billingTypes.map(({ label, value }) => ({
                    id: label,
                    value,
                    label,
                    color: BILLING_TYPE_COLORS[label] ?? 'var(--gray-light)',
                  })),

                  valueFormatter: ({ value }) => toBRL(value),
                  arcLabel: (item) =>
                    totalBillingTypes
                      ? `${Math.round((item.value / totalBillingTypes) * 100)}%`
                      : '',
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
              width={200}
              height={200}
            />
          </div>
        </div>
      </DashboardWidget>
    </DashboardGrid>
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
      <DashboardWidget cols={6} rows={6} tabletCols={12}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={6} rows={3} tabletCols={12}>
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

  if (isLoading) {
    return <div className={styles.dashboardContainer}>{skeleton}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <DashboardScrollStack
        accentColor={accentColor}
        panels={[faturamento, faturamentoDetalhado]}
      />
      <VendorDetailsModal
        isOpen={selectedVendorId !== null}
        onClose={() => setSelectedVendorId(null)}
        vendorId={selectedVendorId}
        filialId={selectedFilialId}
        dashboard="faturamento"
        mes={completeDate.month() + 1}
        ano={completeDate.year()}
      />
    </div>
  );
}
