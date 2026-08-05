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
} from '@/services/dashboardFaturamento';
import useDashboardDate from '@/hooks/useDashboardDate';
import WidgetLoading from '@/components/Dashboards/WidgetLoading/WidgetLoading';

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

  //loadings individuais para cada Widget
  const [loadingRanking, setLoadingRanking] = useState<boolean>(false);
  const [loadingFaturamentoMensal, setLoadingFaturamentoMensal] = useState<boolean>(false);
  const [loadingFaturamentoPorTipo, setLoadingFaturamentoPorTipo] = useState<boolean>(false);
  const [loadingRitmoMeta, setLoadingRitmoMeta] = useState<boolean>(false);
  const [loadingSituacaoPedidos, setLoadingSituacaoPedidos] = useState<boolean>(false);
  const [loadingResumoMensal, setLoadingResumoMensal] = useState<boolean>(false);

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

    async function loadRanking() {
      try {
        setLoadingRanking(true);
        const ranking = await getRankingVendedores(params);
        setSellerRanking(ranking.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRanking(false);
      }
    }

    async function loadFaturamentoMensal() {
      try {
        setLoadingFaturamentoMensal(true);
        const faturamento = await getFaturamentoMensal(params);
        setFaturamentoMensal(faturamento.data?.[0] ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFaturamentoMensal(false);
      }
    }

    async function loadFaturamentoPorTipo() {
      try {
        setLoadingFaturamentoPorTipo(true);
        const faturamentoTipos = await getFaturamentoPorTipo(params);
        setFaturamentoPorTipo(faturamentoTipos.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFaturamentoPorTipo(false);
      }
    }

    async function loadRitmoMeta() {
      try {
        setLoadingRitmoMeta(true);
        const ritmoMeta = await getRitmoMetaFaturamento(params);
        setRitmoDeMeta(ritmoMeta.data?.[0] ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRitmoMeta(false);
      }
    }

    async function loadSituacaoPedidos() {
      try {
        setLoadingSituacaoPedidos(true);
        const situacaoPedidosRes = await getSituacaoPedidos(params);
        setSituacaoPedidos(situacaoPedidosRes.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSituacaoPedidos(false);
      }
    }

    async function loadResumoMensal() {
      try {
        setLoadingResumoMensal(true);
        const periodoInicio = completeDate
          .subtract(5, 'month')
          .startOf('month')
          .format('YYYY-MM-DD');
        const periodoFim = completeDate.startOf('month').format('YYYY-MM-DD');
        const resumoMensalRes = await getResumoMensalFaturamento({
          periodo_inicio: periodoInicio,
          periodo_fim: periodoFim,
        });
        setResumoMensal(resumoMensalRes.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingResumoMensal(false);
      }
    }

    loadRanking();
    loadFaturamentoMensal();
    loadFaturamentoPorTipo();
    loadRitmoMeta();
    loadSituacaoPedidos();
    loadResumoMensal();
  }, [completeDate]);

  return (
    <div className={styles.dashboardContainer}>
      <DashboardGrid>
        {/* Ranking */}
        <DashboardWidget cols={5} rows={6} tabletCols={12} mobileOrder={6} tabletOrder={3}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.rankingTitle}>🏆 Ranking</h2>
              <span>{loadingRanking ? 0 : sellerRanking.length} vendedores</span>
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
              </>
            )}
          </div>
        </DashboardWidget>
        {/* Logo */}
        <DashboardWidget cols={2} rows={1} tabletCols={4} hideOnMobile hideOnTablet>
          <div className={styles.logoContainer}>
            {mounted && (
              <Image
                src={resolvedTheme === 'dark' ? '/logo.png' : '/logo_dark.png'}
                alt="Aços Vital"
                width={200}
                height={43}
              />
            )}
          </div>
        </DashboardWidget>
        {/* Historico de faturamento */}
        <DashboardWidget cols={5} rows={2} tabletCols={8} mobileOrder={3} tabletOrder={2}>
          {loadingResumoMensal ? (
            <div className={styles.defaultCard}>
              <WidgetLoading />
            </div>
          ) : (
            <BillingHistoryChart dataset={billingHistory} color={accentColor} />
          )}
        </DashboardWidget>
        {/* Gauge */}
        <DashboardWidget cols={2} rows={3} tabletCols={4} mobileOrder={1} tabletOrder={1}>
          {loadingFaturamentoMensal ? (
            <div className={styles.defaultCard}>
              <WidgetLoading />
            </div>
          ) : (
            <RevenueGauge
              totalOrders={faturamentoMensal?.qtd_nfs}
              value={gauge || 0}
              target={Number(faturamentoMensal?.meta) || 0}
              totalRevenue={Number(faturamentoMensal?.faturamento_total) || 0}
              lastMonthRevenue={Number(faturamentoMensal?.fat_mes_anterior) || 0}
              lastMonthOrders={Number(faturamentoMensal?.qtd_nfs_mes_anterior) || 0}
              color={accentColor}
            />
          )}
        </DashboardWidget>
        {/* Ritmo de Meta */}
        <DashboardWidget cols={5} rows={1} tabletCols={12} mobileOrder={2} tabletOrder={4}>
          {loadingRitmoMeta ? (
            <div className={styles.defaultCard}>
              <WidgetLoading />
            </div>
          ) : (
            <GoalPaceCard
              status={ritmoDeMeta?.status_ritmo === 'ABAIXO' ? 'below' : 'above'}
              idealDailyTarget={Number(ritmoDeMeta?.meta_diaria_ideal) || 0}
              currentDailyTarget={Number(ritmoDeMeta?.meta_diaria_atual) || 0}
              workingDays={Number(ritmoDeMeta?.dias_uteis_mes) || 0}
              elapsedDays={Number(ritmoDeMeta?.dias_uteis_decorridos) || 0}
              orientation="row"
            />
          )}
        </DashboardWidget>
        {/* Tipo de faturamento */}
        <DashboardWidget cols={2} rows={3} tabletCols={6} mobileOrder={4} tabletOrder={5}>
          <div className={styles.defaultCard}>
            <h3>Tipo de faturamento</h3>
            {loadingFaturamentoPorTipo ? (
              <WidgetLoading />
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
        <DashboardWidget cols={3} rows={3} tabletCols={6} mobileOrder={5} tabletOrder={6}>
          <div className={styles.defaultCard}>
            <h3>Situação</h3>
            {loadingSituacaoPedidos ? (
              <WidgetLoading />
            ) : (
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
            )}
          </div>
        </DashboardWidget>
        {/* Faturamento Diário */}
        <DashboardWidget cols={2} rows={2} tabletCols={6} mobileOrder={2} tabletOrder={7}>
          {loadingFaturamentoMensal ? (
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
                  title: 'Faturamento Diário',
                  icon: <span className={`${styles.titleDot} ${styles.dotGreen}`} />,
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
                  icon: <span className={`${styles.titleDot} ${styles.dotBlue}`} />,
                }}
                background="var(--navy-850)"
              >
                <DailyStatCard
                  todayValue={faturamentoMensal?.pedidos_hoje || 0}
                  yesterdayValue={faturamentoMensal?.pedidos_ontem || 0}
                />
              </SectionCard>
            </div>
          )}
        </DashboardWidget>
      </DashboardGrid>
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
