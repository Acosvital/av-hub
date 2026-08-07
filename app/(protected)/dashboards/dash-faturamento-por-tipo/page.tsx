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
import { useEffect, useState } from 'react';
import {
  FaturamentoMensalProps,
  FaturamentoPorTipoProps,
  RitmoMetaFaturamentoProps,
  SellerRankingProps,
  SituacaoPedidosFaturadosProps,
} from './types';
import {
  getFaturamentoMensal,
  getFaturamentoPorTipo,
  getRankingVendedores,
  getRitmoMetaFaturamento,
  getSituacaoPedidos,
} from '@/services/dashboardFaturamento';
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
const FATURAMENTO_MENSAL_SPOT = [2, 4, 6, 8, 10, 8, 6, 8, 6, 10, 12, 9];
const FATURAMENTO_MENSAL_CONTRATO = [12, 8, 5, 7, 4, 2, 10, 9, 11, 8, 10, 11];
const FATURAMENTO_MENSAL_SEM_CLASSIFICACAO = [2, 3, 4, 8.5, 1.5, 5, 1, 8, 8, 8, 9, 6];
const MAX_CLIENTES_RANKING_MOBILE = 15;

// TODO: mock enquanto não existe endpoint de ranking de clientes
interface ClientRankingMockProps {
  cliente: string;
  faturamento: number;
  qtd_pedidos: number;
  tipo_contrato: ClientOrderType;
}

const CLIENT_RANKING_MOCK: ClientRankingMockProps[] = [
  {
    cliente: 'Metalúrgica Santa Fé',
    faturamento: 482_300,
    qtd_pedidos: 34,
    tipo_contrato: 'CONTRATO',
  },
  { cliente: 'Aços Progresso Ltda', faturamento: 397_150, qtd_pedidos: 28, tipo_contrato: 'SPOT' },
  {
    cliente: 'Construtora Horizonte',
    faturamento: 356_800,
    qtd_pedidos: 19,
    tipo_contrato: 'CONTRATO',
  },
  { cliente: 'Indústria Vale Verde', faturamento: 298_420, qtd_pedidos: 22, tipo_contrato: 'SPOT' },
  {
    cliente: 'Ferro & Cia',
    faturamento: 271_900,
    qtd_pedidos: 31,
    tipo_contrato: 'SEM CLASSIFICAÇÃO',
  },
  {
    cliente: 'Distribuidora Central',
    faturamento: 245_600,
    qtd_pedidos: 17,
    tipo_contrato: 'CONTRATO',
  },
  { cliente: 'Metais Bandeirantes', faturamento: 213_050, qtd_pedidos: 14, tipo_contrato: 'SPOT' },
  {
    cliente: 'Estruturas Norte Sul',
    faturamento: 198_770,
    qtd_pedidos: 12,
    tipo_contrato: 'SEM CLASSIFICAÇÃO',
  },
  { cliente: 'Comercial Aço Rio', faturamento: 176_340, qtd_pedidos: 20, tipo_contrato: 'SPOT' },
  {
    cliente: 'Galvanor Indústria',
    faturamento: 154_890,
    qtd_pedidos: 9,
    tipo_contrato: 'CONTRATO',
  },
  {
    cliente: 'Perfilados União',
    faturamento: 132_410,
    qtd_pedidos: 11,
    tipo_contrato: 'SEM CLASSIFICAÇÃO',
  },
  { cliente: 'Siderúrgica Boa Vista', faturamento: 118_260, qtd_pedidos: 8, tipo_contrato: 'SPOT' },
  {
    cliente: 'Metalcorte Express',
    faturamento: 97_530,
    qtd_pedidos: 15,
    tipo_contrato: 'CONTRATO',
  },
  {
    cliente: 'Chapas & Tubos SA',
    faturamento: 84_120,
    qtd_pedidos: 7,
    tipo_contrato: 'SEM CLASSIFICAÇÃO',
  },
  { cliente: 'Aço Vital Distribuição', faturamento: 71_980, qtd_pedidos: 6, tipo_contrato: 'SPOT' },
];

export default function FaturamentoPorTipo() {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedFilialId, setSelectedFilialId] = useState<string | null>(null);
  const [sellerRanking, setSellerRanking] = useState<SellerRankingProps[]>([]);
  const [faturamentoMensal, setFaturamentoMensal] = useState<FaturamentoMensalProps | null>(null);
  const [faturamentoPorTipo, setFaturamentoPorTipo] = useState<FaturamentoPorTipoProps[]>([]);
  const [ritmoDeMeta, setRitmoDeMeta] = useState<RitmoMetaFaturamentoProps | null>(null);
  const [situacaoPedidos, setSituacaoPedidos] = useState<SituacaoPedidosFaturadosProps[]>([]);
  const [selectedClientTypes, setSelectedClientTypes] = useState<ClientOrderType[]>([]);

  //só exibe o dashboard quando todas as requisições terminarem
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { completeDate } = useDashboardDate();
  const accentColor = 'var(--gold)';
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const top3 = sellerRanking.slice(0, 3);
  const otherVendors = sellerRanking.slice(3);
  const scrollDuration = `${otherVendors.length * 1.7}s`;
  const gauge = Number(faturamentoMensal?.perc_atingimento);
  const billingTypes = faturamentoPorTipo.map((tipo) => ({
    label: tipo.tipo_contrato,
    value: Number(tipo.faturamento),
  }));
  const totalBillingTypes = billingTypes.reduce((sum, t) => sum + t.value, 0);
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

  const totalClientRevenue = CLIENT_RANKING_MOCK.reduce((sum, c) => sum + c.faturamento, 0);
  const clientRankingFull = CLIENT_RANKING_MOCK.filter(
    (c) => selectedClientTypes.length === 0 || selectedClientTypes.includes(c.tipo_contrato)
  )
    .sort((a, b) => b.faturamento - a.faturamento)
    .map((c, i) => ({
      ...c,
      posicao: String(i + 1),
      perc_participacao: ((c.faturamento / totalClientRevenue) * 100).toFixed(1),
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
        getFaturamentoPorTipo(params),
        getRitmoMetaFaturamento(params),
        getSituacaoPedidos(params),
      ]);
      const [ranking, faturamento, faturamentoTipos, ritmoMeta, situacaoPedidosRes] = results;

      if (ranking.status === 'fulfilled') setSellerRanking(ranking.value.data ?? []);
      else console.error(ranking.reason);

      if (faturamento.status === 'fulfilled')
        setFaturamentoMensal(faturamento.value.data?.[0] ?? null);
      else console.error(faturamento.reason);

      if (faturamentoTipos.status === 'fulfilled')
        setFaturamentoPorTipo(faturamentoTipos.value.data ?? []);
      else console.error(faturamentoTipos.reason);

      if (ritmoMeta.status === 'fulfilled') setRitmoDeMeta(ritmoMeta.value.data?.[0] ?? null);
      else console.error(ritmoMeta.reason);

      if (situacaoPedidosRes.status === 'fulfilled')
        setSituacaoPedidos(situacaoPedidosRes.value.data ?? []);
      else console.error(situacaoPedidosRes.reason);

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
                data: isMobile ? MESES_FATURAMENTO_MENSAL.slice(-6) : MESES_FATURAMENTO_MENSAL,
              },
            ]}
            series={[
              {
                id: 'SPOT',
                label: 'SPOT',
                data: isMobile ? FATURAMENTO_MENSAL_SPOT.slice(-6) : FATURAMENTO_MENSAL_SPOT,
                color: 'var(--green)',
                curve: 'natural',
                area: true,
              },
              {
                id: 'CONTRATO',
                label: 'CONTRATO',
                data: isMobile
                  ? FATURAMENTO_MENSAL_CONTRATO.slice(-6)
                  : FATURAMENTO_MENSAL_CONTRATO,
                color: 'var(--purple)',
                curve: 'natural',
                area: true,
              },
              {
                id: 'SEM CLASSIFICAÇÃO',
                label: 'SEM CLASSIFICAÇÃO',
                data: isMobile
                  ? FATURAMENTO_MENSAL_SEM_CLASSIFICACAO.slice(-6)
                  : FATURAMENTO_MENSAL_SEM_CLASSIFICACAO,
                color: 'var(--white)',
                curve: 'natural',
                area: true,
              },
            ]}
            height={260}
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
                <ClientCard key={c.cliente} {...c} color={accentColor} />
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
                  <ClientCard key={c.cliente} {...c} color={accentColor} />
                ))}
              </div>
              <div className={styles.vendorGroup} aria-hidden="true">
                {otherClients.length >= 10 &&
                  otherClients.map((c) => (
                    <ClientCard key={`dup-${c.cliente}`} {...c} color={accentColor} />
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
