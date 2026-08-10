'use client';
import { useEffect, useMemo, useState } from 'react';
import styles from './styles.module.css';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import toBRL from '@/utils/toBRL';
import CommissionDonutChart, {
  DonutItem,
} from '@/components/Dashboards/CommissionDonutChart/CommissionDonutChart';
import CommissionRankingTable, {
  CommissionRow,
} from '@/components/Dashboards/CommissionRankingTable/CommissionRankingTable';
import CommissionDetailsModal from '@/components/Dashboards/CommissionDetailsModal/CommissionDetailsModal';
import useDashboardDate from '@/hooks/useDashboardDate';
import { CoordenadorProps, CoordenadoresProps, ComissoesProvisoriasProps } from './types';
import { getComissoesProvisorias } from '@/services/dashboards/dashboardComissoes';
import { getFaturamentoMensal } from '@/services/dashboards/dashboardFaturamento';
import coordenadoresJson from './coordenadores.json';
import { Skeleton } from '@mui/material';

//No momento os gerentes estão mockados nesse json (calculo de comissão diferente);
const coordenadoresData = coordenadoresJson as CoordenadoresProps;

// Comissão de coordenadores é baseada no Faturamento Total (mesma métrica do dash-faturamento);
const mapCoordenadorToRow = (coordenador: CoordenadorProps, faturamentoTotal: number) => {
  const comissao = (coordenador.porcentagemComissao / 100) * faturamentoTotal;
  const bloqueado = coordenador.valorBloqueado ?? 0;
  return {
    name: coordenador.vendedor,
    faturado: coordenador.valorTotalFaturado,
    aFaturar: coordenador.valorTotalPendente,
    ajudaCusto: coordenador.AjudaCusto,
    comissao,
    bloqueado,
    total: coordenador.AjudaCusto + comissao - bloqueado,
  };
};

export default function Comissoes() {
  const [selectedVendor, setSelectedVendor] = useState<CommissionRow | null>(null);
  //só exibe o dashboard quando todas as requisições terminarem
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [comissoes, setComissoes] = useState<ComissoesProvisoriasProps | null>(null);
  const [faturamentoTotal, setFaturamentoTotal] = useState<number>(0);
  const { completeDate } = useDashboardDate();

  //Carrega o json montado inteiro do banco, e o faturamento mensal para calcular a gerência;
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const params = { mes: completeDate.month() + 1, ano: completeDate.year() };
        const [comissoesData, faturamentoData] = await Promise.all([
          getComissoesProvisorias({ ano_mes: completeDate.format('YYYY-MM') }),
          getFaturamentoMensal(params),
        ]);
        setComissoes(comissoesData.comissoes_provisoria?.[0] ?? null);
        setFaturamentoTotal(Number(faturamentoData.data?.[0]?.faturamento_total) || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, [completeDate]);

  // Coordenadores presentes em "excessoes" são vendedores, porém comissão baseada no faturamento total, não gerência:
  const managers: CommissionRow[] = useMemo(() => {
    return coordenadoresData.coordenadores
      .map((c) => mapCoordenadorToRow(c, faturamentoTotal))
      .sort((a, b) => b.total - a.total)
      .map((m, index) => ({ ...m, rank: index + 1 }));
  }, [faturamentoTotal]);

  // Coordenadores em "excessoes" (ex: Antonio Paiva) entram na aba/KPI de vendedores, não de gerência:
  const exceptionVendors = useMemo(() => {
    return coordenadoresData.excessoes.map((c) => mapCoordenadorToRow(c, faturamentoTotal));
  }, [faturamentoTotal]);

  //prepara o array de vendedores, mergeando com as excessões:
  const vendors: CommissionRow[] = useMemo(() => {
    const apiVendors = (comissoes?.vendedores ?? []).map((v) => ({
      name: v.vendedor,
      faturado: v.valorTotalFaturado,
      aFaturar: v.valorTotalPendente,
      ajudaCusto: v.AjudaCusto,
      comissao: v.valorTotalComissao,
      bloqueado: v.valorBloqueado,
      total: v.AjudaCusto + v.valorTotalComissao - (v.valorBloqueado ?? 0),
    }));
    return [...apiVendors, ...exceptionVendors]
      .sort((a, b) => b.total - a.total)
      .map((v, index) => ({ ...v, rank: index + 1 }));
  }, [comissoes, exceptionVendors]);

  //prepara os cards iniciais com os totais:
  const kpiCards = [
    {
      label: 'Comissão Vendedores',
      value:
        (comissoes?.resumo.valorTotalComissao ?? 0) +
        exceptionVendors.reduce((sum, v) => sum + v.comissao, 0) -
        (comissoes?.resumo.valorTotalBloqueado ?? 0),
      color: 'var(--green-light)',
    },
    {
      label: 'Comissões Bloqueadas',
      value: comissoes?.resumo.valorTotalBloqueado ?? 0,
      color: 'var(--green)',
    },
    {
      label: 'Ajuda de Custo',
      value:
        (comissoes?.resumo.totalAjudaCusto ?? 0) +
        managers.reduce((sum, m) => sum + m.ajudaCusto, 0) +
        exceptionVendors.reduce((sum, v) => sum + v.ajudaCusto, 0),
      color: 'var(--gold)',
    },
    {
      label: 'Comissão Gerência',
      value: managers.reduce((sum, m) => sum + m.comissao, 0),
      color: 'var(--blue)',
    },
  ];

  //prepara os dados que serão enviados para o grafico de Donut:
  const donutData: DonutItem[] = [
    { label: 'Comissão Vendedores', value: kpiCards[0].value, color: 'var(--green-light)' },
    { label: 'Comissões Bloqueadas', value: kpiCards[1].value, color: 'var(--green)' },
    { label: 'Ajuda de Custo', value: kpiCards[2].value, color: 'var(--yellow)' },
    { label: 'Comissão Gerência', value: kpiCards[3].value, color: 'var(--blue)' },
  ];

  //agrupa os totais para criar o total geral
  const total = kpiCards.reduce((sum, kpi) => sum + kpi.value, 0);

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
      <DashboardWidget cols={4} rows={2} tabletCols={12} mobileOrder={1} tabletOrder={1}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={8} rows={6} tabletCols={12} mobileOrder={3} tabletOrder={3}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={4} rows={4} tabletCols={12} mobileOrder={2} tabletOrder={2}>
        {skeletonWidget}
      </DashboardWidget>
    </DashboardGrid>
  );

  if (isLoading) {
    return <div className={styles.dashboardContainer}>{skeleton}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <DashboardGrid>
        <DashboardWidget cols={4} rows={2} tabletCols={12} mobileOrder={1} tabletOrder={1}>
          <div className={styles.kpiGrid}>
            {kpiCards.map((kpi) => (
              <div key={kpi.label} className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{kpi.label}</span>
                <span className={styles.kpiValue} style={{ color: kpi.color }}>
                  {toBRL(kpi.value)}
                </span>
              </div>
            ))}
          </div>
        </DashboardWidget>
        <DashboardWidget cols={8} rows={6} tabletCols={12} mobileOrder={3} tabletOrder={3}>
          <CommissionRankingTable
            vendors={vendors}
            managers={managers}
            onRowClick={setSelectedVendor}
          />
        </DashboardWidget>
        <DashboardWidget cols={4} rows={4} tabletCols={12} mobileOrder={2} tabletOrder={2}>
          <CommissionDonutChart data={donutData} total={total} />
        </DashboardWidget>
      </DashboardGrid>
      <CommissionDetailsModal
        isOpen={selectedVendor !== null}
        onClose={() => setSelectedVendor(null)}
        vendor={selectedVendor}
      />
    </div>
  );
}
