'use client';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import VendorCard from '@/components/Dashboards/VendorCard/VendorCard';
import RevenueGauge from '@/components/Dashboards/RevenueGauge/RevenueGauge';
import GoalPaceCard from '@/components/Dashboards/GoalPaceCard/GoalPaceCard';
import BillingHistoryChart from '@/components/Dashboards/BillingHistoryChart/BillingHistoryChart';
import VendorDetailsModal from '@/components/Dashboards/VendorDetailsModal/VendorDetailsModal';
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
} from '@/services/dashboardFaturamento';
import { CircularProgress } from '@mui/material';
import useDashboardDate from '@/hooks/useDashboardDate';

const SITUACAO_DEFINITIONS = [
  { id: 'G1', label: 'Cancelados' },
  { id: 'G2', label: 'Devolvidos' },
  { id: 'G3', label: 'Recusados' },
  { id: 'G6', label: 'Refaturamento' },
];

export default function Faturamento() {
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [sellerRanking, setSellerRanking] = useState<SellerRankingProps[]>([]);
  const [faturamentoMensal, setFaturamentoMensal] = useState<FaturamentoMensalProps | null>(null);
  const [faturamentoPorTipo, setFaturamentoPorTipo] = useState<FaturamentoPorTipoProps[]>([]);
  const [ritmoDeMeta, setRitmoDeMeta] = useState<RitmoMetaFaturamentoProps | null>(null);
  const [situacaoPedidos, setSituacaoPedidos] = useState<SituacaoPedidosFaturadosProps[]>([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensalFaturamentoProps[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();
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

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoading(true);
        const periodoInicio = completeDate
          .subtract(5, 'month')
          .startOf('month')
          .format('YYYY-MM-DD');
        const periodoFim = completeDate.startOf('month').format('YYYY-MM-DD');
        const [
          ranking,
          faturamento,
          faturamentoTipos,
          ritmoMeta,
          situacaoPedidosRes,
          resumoMensalRes,
        ] = await Promise.all([
          getRankingVendedores({ mes: completeDate.month() + 1, ano: completeDate.year() }),
          getFaturamentoMensal({ mes: completeDate.month() + 1, ano: completeDate.year() }),
          getFaturamentoPorTipo({ mes: completeDate.month() + 1, ano: completeDate.year() }),
          getRitmoMetaFaturamento({ mes: completeDate.month() + 1, ano: completeDate.year() }),
          getSituacaoPedidos({ mes: completeDate.month() + 1, ano: completeDate.year() }),
          getResumoMensalFaturamento({ periodo_inicio: periodoInicio, periodo_fim: periodoFim }),
        ]);
        setSellerRanking(ranking.data ?? []);
        setFaturamentoMensal(faturamento.data?.[0] ?? []);
        setFaturamentoPorTipo(faturamentoTipos.data ?? []);
        setRitmoDeMeta(ritmoMeta.data?.[0] ?? []);
        setSituacaoPedidos(situacaoPedidosRes.data ?? []);
        setResumoMensal(resumoMensalRes.data ?? []);
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
        {/* Ranking */}
        <DashboardWidget cols={5} rows={6} mobileOrder={6}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
              <span>{loading ? 0 : sellerRanking.length + 1} vendedores</span>
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
                        key={v.cod_vendedor}
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
                    className={`${sellerRanking.length > 9 && styles.autoScroll}`}
                    style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
                  >
                    <div className={styles.vendorGroup}>
                      {otherVendors.map((v) => (
                        <VendorCard
                          key={v.cod_vendedor}
                          {...v}
                          onClick={() => setSelectedVendorId(Number(v.cod_vendedor))}
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
        {/* Logo */}
        <DashboardWidget cols={2} rows={1} hideOnMobile>
          <div className={styles.logoContainer}>
            <Image
              src={resolvedTheme === 'dark' ? '/logo.png' : '/logo_dark.png'}
              alt="Aços Vital"
              width={200}
              height={43}
            />
          </div>
        </DashboardWidget>
        {/* Historico de faturamento */}
        <DashboardWidget cols={5} rows={2} mobileOrder={3}>
          <BillingHistoryChart dataset={billingHistory} />
        </DashboardWidget>
        {/* Gauge */}
        <DashboardWidget cols={2} rows={3} mobileOrder={1}>
          <RevenueGauge
            value={gauge || 0}
            target={Number(faturamentoMensal?.meta) || 0}
            totalRevenue={Number(faturamentoMensal?.faturamento_total) || 0}
            lastMonthRevenue={Number(faturamentoMensal?.fat_mes_anterior) || 0}
            lastMonthOrders={Number(faturamentoMensal?.qtd_nfs_mes_anterior) || 0}
            color={accentColor}
          />
        </DashboardWidget>
        {/* Ritmo de Meta */}
        <DashboardWidget cols={5} rows={1} mobileOrder={2}>
          <GoalPaceCard
            status={ritmoDeMeta?.status_ritmo === 'ABAIXO' ? 'below' : 'above'}
            idealDailyTarget={Number(ritmoDeMeta?.meta_diaria_ideal) || 0}
            currentDailyTarget={Number(ritmoDeMeta?.meta_diaria_atual) || 0}
            workingDays={Number(ritmoDeMeta?.dias_uteis_mes) || 0}
            elapsedDays={Number(ritmoDeMeta?.dias_uteis_decorridos) || 0}
          />
        </DashboardWidget>
        {/* Tipo de faturamento */}
        <DashboardWidget cols={2} rows={3} mobileOrder={4}>
          <div className={styles.defaultCard}>
            <h3>Tipo de faturamento</h3>
            {loading ? (
              <div className={styles.loading}>
                <CircularProgress size={50} />
                <span>Carregando...</span>
              </div>
            ) : (
              <div className={styles.billings}>
                {billingTypes.map(({ label, value }) => (
                  <div key={label} className={styles.billing}>
                    <h3>{label}</h3>
                    <span>{toBRL(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardWidget>
        {/* Situação */}
        <DashboardWidget cols={3} rows={3} mobileOrder={5}>
          <div className={styles.defaultCard}>
            <h3>Situação</h3>
            <div className={styles.situationGroup}>
              {situations.map(({ label, count, value }) => (
                <div key={label} className={styles.situationCard}>
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
        {/* Faturamento Diário */}
        <DashboardWidget cols={2} rows={2} mobileOrder={2}>
          <div className={styles.defaultCard}>
            <div>
              <h3>Faturamento Diário</h3>
              <div className={styles.billingCard}>
                <div>
                  <h4 className={styles.billingTitle}>Hoje</h4>
                  <span className={styles.billingValue}>
                    {toBRL(Number(faturamentoMensal?.fat_hoje) || 0)}
                  </span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>
                    {toBRL(Number(faturamentoMensal?.fat_ontem) || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3>Volume de Notas Fiscais</h3>
              <div className={styles.billingCard}>
                <div>
                  <h4 className={styles.billingTitle}>Hoje</h4>
                  <span className={styles.billingValue}>
                    {faturamentoMensal?.pedidos_hoje || 0}
                  </span>
                </div>
                <div>
                  <h4 className={styles.billingTitle}>Ontem</h4>
                  <span className={styles.billingValue}>
                    {faturamentoMensal?.pedidos_ontem || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DashboardWidget>
      </DashboardGrid>
      <VendorDetailsModal
        isOpen={selectedVendorId !== null}
        onClose={() => setSelectedVendorId(null)}
        vendorId={selectedVendorId}
        dashboard="faturamento"
        mes={completeDate.month() + 1}
        ano={completeDate.year()}
      />
    </div>
  );
}
