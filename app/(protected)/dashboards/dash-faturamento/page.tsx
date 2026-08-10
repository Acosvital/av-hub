'use client';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import SectionCard from '@/components/Dashboards/SectionCard/SectionCard';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import BillingHistoryChart from '@/components/Dashboards/BillingHistoryChart/BillingHistoryChart';
import VendorDetailsModal from '@/components/Dashboards/VendorDetailsModal/VendorDetailsModal';
import DailyStatCard from '@/components/Dashboards/DailyStatCard/DailyStatCard';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import toBRL from '@/utils/toBRL';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useEffect, useState } from 'react';
import {
  FaturamentoMensalProps,
  FaturamentoPorTipoProps,
  ResumoMensalFaturamentoProps,
  RitmoMetaFaturamentoProps,
  SellerRankingProps,
  SituacaoPedidosFaturadosProps,
} from './types';
import {
  getFaturamentoMensal,
  getFaturamentoPorTipo,
  getRankingVendedores,
  getResumoMensalFaturamento,
  getRitmoMetaFaturamento,
  getSituacaoPedidos,
  parseFaturamentoPorTipoBuckets,
} from '@/services/dashboardFaturamento';
import useDashboardDate from '@/hooks/useDashboardDate';
import DashboardScrollStack from '@/components/Dashboards/DashboardScrollStack/DashboardScrollStack';
import Card from '@/components/Ui/Card/Card';
import { LineChart, PieChart } from '@mui/x-charts';
import { Skeleton } from '@mui/material';

const SITUACAO_DEFINITIONS = [
  { id: 'G1', label: 'Cancelados' },
  { id: 'G2', label: 'Devolvidos' },
  { id: 'G3', label: 'Recusados' },
  { id: 'G6', label: 'Refaturamento' },
];

export default function Faturamento() {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedFilialId, setSelectedFilialId] = useState<string | null>(null);
  const [sellerRanking, setSellerRanking] = useState<SellerRankingProps[]>([]);
  const [faturamentoMensal, setFaturamentoMensal] = useState<FaturamentoMensalProps | null>(null);
  const [faturamentoPorTipo, setFaturamentoPorTipo] = useState<FaturamentoPorTipoProps[]>([]);
  const [ritmoDeMeta, setRitmoDeMeta] = useState<RitmoMetaFaturamentoProps | null>(null);
  const [situacaoPedidos, setSituacaoPedidos] = useState<SituacaoPedidosFaturadosProps[]>([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensalFaturamentoProps[]>([]);

  //só exibe o dashboard quando todas as requisições terminarem
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { completeDate } = useDashboardDate();
  const accentColor = 'var(--gold)';

  const top3 = sellerRanking.slice(0, 3);
  const otherVendors = sellerRanking.slice(3);
  const scrollDuration = `${otherVendors.length * 1.7}s`;
  const gauge = Number(faturamentoMensal?.perc_atingimento);
  const billingTypes = faturamentoPorTipo.map((tipo) => ({
    label: tipo.tipo_contrato,
    value: Number(tipo.faturamento),
  }));
  const situacaoPorGrupo = new Map(situacaoPedidos.map((s) => [s.grupo_deducao, s]));
  const situations = SITUACAO_DEFINITIONS.map(({ id, label }) => {
    const situacao = situacaoPorGrupo.get(id);
    return {
      id,
      label,
      count: Number(situacao?.qtd_nfs) || 0,
      value: Number(situacao?.valor_total) || 0,
    };
  });
  const billingHistory = [...resumoMensal]
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((item) => ({
      mes: dayjs(item.periodo).locale('pt-br').format('MMM'),
      faturamento: Number(item.fat_liquido),
    }));

  //state que avisa quando renderizar a Logo, com o tema certo
  useEffect(() => {
    setMounted(true);
  }, []);

  //Carrega os dados do dashboard a partir do filtro de data
  useEffect(() => {
    const params = { mes: completeDate.month() + 1, ano: completeDate.year() };
    const periodoInicio = completeDate.subtract(5, 'month').startOf('month').format('YYYY-MM-DD');
    const periodoFim = completeDate.startOf('month').format('YYYY-MM-DD');

    async function loadAll() {
      setIsLoading(true);

      const results = await Promise.allSettled([
        getRankingVendedores(params),
        getFaturamentoMensal(params),
        getFaturamentoPorTipo(params),
        getRitmoMetaFaturamento(params),
        getSituacaoPedidos(params),
        getResumoMensalFaturamento({ periodo_inicio: periodoInicio, periodo_fim: periodoFim }),
      ]);
      const [ranking, faturamento, faturamentoTipos, ritmoMeta, situacaoPedidosRes, resumoMensalRes] =
        results;

      if (ranking.status === 'fulfilled') setSellerRanking(ranking.value.data ?? []);
      else console.error(ranking.reason);

      if (faturamento.status === 'fulfilled')
        setFaturamentoMensal(faturamento.value.data?.[0] ?? null);
      else console.error(faturamento.reason);

      if (faturamentoTipos.status === 'fulfilled') {
        const buckets = parseFaturamentoPorTipoBuckets(faturamentoTipos.value.data);
        setFaturamentoPorTipo(buckets[0]?.entries ?? []);
      } else console.error(faturamentoTipos.reason);

      if (ritmoMeta.status === 'fulfilled') setRitmoDeMeta(ritmoMeta.value.data?.[0] ?? null);
      else console.error(ritmoMeta.reason);

      if (situacaoPedidosRes.status === 'fulfilled')
        setSituacaoPedidos(situacaoPedidosRes.value.data ?? []);
      else console.error(situacaoPedidosRes.reason);

      if (resumoMensalRes.status === 'fulfilled') setResumoMensal(resumoMensalRes.value.data ?? []);
      else console.error(resumoMensalRes.reason);

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
      <DashboardScrollStack accentColor={accentColor} panels={[faturamento]} />
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
