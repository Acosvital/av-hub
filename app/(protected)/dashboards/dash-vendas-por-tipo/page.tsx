'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardGrid from '@/components/Dashboards/DashboardGrid/DashboardGrid';
import DashboardWidget from '@/components/Dashboards/DashboardWidget/DashboardWidget';
import DashboardScrollStack from '@/components/Dashboards/DashboardScrollStack/DashboardScrollStack';
import styles from './styles.module.css';
import toBRL from '@/utils/toBRL';
import toCompactBRL from '@/utils/toCompactBRL';
import useDashboardDate from '@/hooks/useDashboardDate';
import useDashboardEmpresa from '@/hooks/useDashboardEmpresa';
import {
  getRankingClientesVendas,
  getVendasPorTipo,
  parseVendasPorTipoBuckets,
  VendasPorTipoBucket,
} from '@/services/dashboards/dashboardVendas';
// TODO: ainda não existe um endpoint de situação dos pedidos específico de vendas,
// então reaproveitamos o mesmo endpoint usado pelo dashboard de faturamento por tipo.
import { getSituacaoPedidos } from '@/services/dashboards/dashboardFaturamento';
import { SituacaoPedidosFaturadosProps } from '../dash-faturamento-por-tipo/types';
import { ClientRankingVendasProps, VendasPorTipoProps } from './types';
import { Skeleton, useMediaQuery } from '@mui/material';
import ClientCard, { ClientOrderType } from '@/components/Dashboards/ClientCard/ClientCard';
import { chartsGridClasses, LineChart, PieChart } from '@mui/x-charts';

const TIPO_VENDA_DEFINITIONS: VendasPorTipoProps['tipo_contrato'][] = [
  'SPOT',
  'CONTRATO',
  'SEM CLASSIFICAÇÃO',
];

const BILLING_TYPE_COLORS: Record<string, string> = {
  SPOT: 'var(--fuchsia)',
  CONTRATO: 'var(--teal)',
  'SEM CLASSIFICAÇÃO': 'var(--white)',
};

const SITUACAO_DEFINITIONS = [
  { id: 'G1', label: 'Cancelados', color: 'var(--red)' },
  { id: 'G2', label: 'Devolvidos', color: 'var(--blue)' },
  { id: 'G3', label: 'Recusados', color: 'var(--yellow)' },
  { id: 'G6', label: 'Refaturamento', color: 'var(--orange)' },
];

const CLIENT_TYPE_FILTERS: ClientOrderType[] = ['SPOT', 'CONTRATO', 'SEM CLASSIFICAÇÃO'];

const MESES_ABREVIADOS = [
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
const MAX_CLIENTES_RANKING_MOBILE = 15;
// Altura que a legenda "bottom" do PieChart consome por fora da área de
// desenho (até 3 linhas de rótulo + gap — "SEM CLASSIFICAÇÃO" é o mais longo).
const PIE_LEGEND_RESERVED_HEIGHT = 70;

const labelMesAno = (mes: number, ano: number) =>
  `${MESES_ABREVIADOS[mes - 1]}/${String(ano).slice(-2)}`;

const VendasPorTipo = () => {
  const [vendasPorTipoBuckets, setVendasPorTipoBuckets] = useState<VendasPorTipoBucket[]>([]);
  const [situacaoPedidos, setSituacaoPedidos] = useState<SituacaoPedidosFaturadosProps[]>([]);

  /* Segundo Dashboard*/
  const [selectedClientTypes, setSelectedClientTypes] = useState<ClientOrderType[]>([]);
  const [clientRankingData, setClientRankingData] = useState<ClientRankingVendasProps[]>([]);

  //só exibe o dashboard quando todas as requisições terminarem
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { completeDate } = useDashboardDate();
  const { codigoEmpresa } = useDashboardEmpresa();
  const accentColor = 'var(--green)';
  const isMobile = useMediaQuery('(max-width: 1024px)');

  // O X-Charts calcula o layout da legenda a partir do tamanho do container
  // via ResizeObserver interno, e esse cálculo não reconverge direito depois
  // de um resize (ex: colapsar a sidebar) — a legenda fica desenhada fora da
  // área do gráfico. Medindo a área real aqui e passando width/height
  // explícitos evita depender do auto-cálculo problemático (mesmo padrão do
  // CommissionDonutChart).
  // Callback ref em vez de useRef+useEffect: o card só existe no DOM depois
  // que os dados terminam de carregar (antes disso a página mostra o
  // skeleton), então um efeito com deps [] rodaria uma vez só, com o ref
  // ainda nulo, e nunca mais depois que o elemento real aparecesse.
  const [pieChartSize, setPieChartSize] = useState({ width: 260, height: 220 });
  const pieChartObserverRef = useRef<ResizeObserver | null>(null);
  const pieChartRef = useCallback((el: HTMLDivElement | null) => {
    pieChartObserverRef.current?.disconnect();
    pieChartObserverRef.current = null;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) setPieChartSize({ width: rect.width, height: rect.height });

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setPieChartSize({ width, height });
    });
    observer.observe(el);
    pieChartObserverRef.current = observer;
  }, []);

  const anchorMes = completeDate.month() + 1;
  const anchorAno = completeDate.year();
  const anchorKey = anchorAno * 12 + anchorMes;

  const vendasPorTipoMesAtual =
    vendasPorTipoBuckets.find((b) => b.ano * 12 + b.mes === anchorKey)?.entries ?? [];
  // O gráfico mostra só jan-mês atual do ano selecionado — nunca "vaza" pro
  // ano anterior, mesmo que o mês atual seja janeiro ou fevereiro.
  const mesesAnoVigente = vendasPorTipoBuckets.filter((b) => b.ano === anchorAno);

  const vendasPorTipoPorLabel = new Map(vendasPorTipoMesAtual.map((t) => [t.tipo_contrato, t]));
  const tiposVenda = TIPO_VENDA_DEFINITIONS.map((label) => ({
    label,
    value: Number(vendasPorTipoPorLabel.get(label)?.vendas) || 0,
  }));
  const totalVendaTipos = tiposVenda.reduce((sum, t) => sum + t.value, 0);
  const tiposVendaPercentual = TIPO_VENDA_DEFINITIONS.map((label) => ({
    label,
    value: Number(vendasPorTipoPorLabel.get(label)?.percentual_vendas) || 0,
  }));

  const faturamentoMensalLabels = mesesAnoVigente.map((b) => labelMesAno(b.mes, b.ano));
  const faturamentoMensalPorTipo = TIPO_VENDA_DEFINITIONS.reduce<Record<string, number[]>>(
    (acc, tipo) => {
      acc[tipo] = mesesAnoVigente.map(
        (b) => Number(b.entries.find((e) => e.tipo_contrato === tipo)?.vendas) || 0
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
    {
      cliente: string;
      faturamento: number;
      qtd_pedidos: number;
      porTipo: Partial<Record<ClientOrderType, number>>;
    }
  >();
  clientRankingData
    .filter((c) => activeClientTypes.includes(c.tipo_contrato))
    .forEach((c) => {
      const group = clientGroups.get(c.id_parceiro) ?? {
        cliente: c.cliente,
        faturamento: 0,
        qtd_pedidos: 0,
        porTipo: {},
      };
      group.faturamento += Number(c.vendas);
      group.qtd_pedidos += Number(c.qtd_pedidos);
      group.porTipo[c.tipo_contrato] = (group.porTipo[c.tipo_contrato] ?? 0) + Number(c.vendas);
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
      breakdown: CLIENT_TYPE_FILTERS.map((tipo) => ({
        tipo,
        valor: group.porTipo[tipo] ?? 0,
      })),
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
    const params = {
      mes: completeDate.month() + 1,
      ano: completeDate.year(),
      codigo_empresa: codigoEmpresa ?? undefined,
    };

    // O endpoint de vendas-por-tipo exige mes/ano e só devolve um mês por chamada
    // (sem parâmetros ele quebra com 500 no backend) — para montar o LineChart do
    // ano vigente, buscamos mês a mês (jan até o mês selecionado) em paralelo, sem
    // nunca cruzar pro ano anterior.
    const mesesHistorico = Array.from({ length: completeDate.month() + 1 }, (_, i) => {
      const data = completeDate.startOf('year').add(i, 'month');
      return {
        mes: data.month() + 1,
        ano: data.year(),
        codigo_empresa: codigoEmpresa ?? undefined,
      };
    });

    async function loadAll() {
      setIsLoading(true);

      const vendasPorTipoHistorico = Promise.allSettled(
        mesesHistorico.map((mesAno) => getVendasPorTipo(mesAno))
      ).then((respostas) =>
        respostas.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value.data ?? [])
      );

      const results = await Promise.allSettled([
        vendasPorTipoHistorico,
        getRankingClientesVendas(params),
        getSituacaoPedidos(params),
      ]);
      const [vendasTipo, rankingClientes, situacaoPedidosRes] = results;

      if (vendasTipo.status === 'fulfilled')
        setVendasPorTipoBuckets(parseVendasPorTipoBuckets(vendasTipo.value));
      else console.error(vendasTipo.reason);

      if (rankingClientes.status === 'fulfilled')
        setClientRankingData(rankingClientes.value.data ?? []);
      else console.error(rankingClientes.reason);

      if (situacaoPedidosRes.status === 'fulfilled')
        setSituacaoPedidos(situacaoPedidosRes.value.data ?? []);
      else console.error(situacaoPedidosRes.reason);

      setIsLoading(false);
    }

    loadAll();
  }, [completeDate, codigoEmpresa]);

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
      <DashboardWidget cols={3} rows={3} tabletCols={6}>
        {skeletonWidget}
      </DashboardWidget>
      <DashboardWidget cols={3} rows={3} tabletCols={6}>
        {skeletonWidget}
      </DashboardWidget>
    </DashboardGrid>
  );

  const dashboardDetalhado = (
    <DashboardGrid>
      {/* Ranking Clientes */}
      <DashboardWidget cols={6} rows={6} tabletCols={12}>
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
      <DashboardWidget cols={6} rows={3} tabletCols={12}>
        <div className={styles.defaultCard}>
          <h3>Faturamento Mensal</h3>
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="lineAreaGradient-spot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--fuchsia)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--fuchsia)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineAreaGradient-contrato" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
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
                color: 'var(--fuchsia)',
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
                color: 'var(--teal)',
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
      {/* Faturamento por tipo */}
      <DashboardWidget cols={3} rows={3} tabletCols={6}>
        <div className={styles.defaultCard} style={{ backgroundColor: 'transparent' }}>
          <div className={styles.pieWrapper}>
            <div className={styles.pieTotal}>
              <span className={styles.tipoFaturamentoLabel}>Total Vendas por tipo</span>
              <span className={styles.tipoFaturamentoValue}>{toBRL(totalVendaTipos)}</span>
            </div>
            <div ref={pieChartRef} style={{ flex: 1, minHeight: 0, width: '100%' }}>
              <PieChart
                width={pieChartSize.width}
                // O height do PieChart só reserva espaço pro donut — a legenda
                // ("bottom") é desenhada por baixo, somando altura em vez de
                // dividir o espaço dado. Sem descontar isso aqui, a legenda
                // vaza pra fora do card em containers baixos (notebook).
                height={isMobile ? 260 : Math.max(120, pieChartSize.height - PIE_LEGEND_RESERVED_HEIGHT)}
                series={[
                  {
                    innerRadius: 50,
                    outerRadius: 100,
                    data: tiposVendaPercentual.map(({ label, value }) => ({
                      id: label,
                      value,
                      label,
                      color: BILLING_TYPE_COLORS[label] ?? 'var(--gray-light)',
                    })),

                    valueFormatter: ({ value }) => `${value.toFixed(1)}%`,
                    arcLabel: (item) => `${Math.round(item.value)}%`,
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
                  gap: 'var(--space-2)',
                }}
              />
            </div>
          </div>
        </div>
      </DashboardWidget>
      {/* Situação */}
      <DashboardWidget cols={3} rows={3} tabletCols={6}>
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
    </DashboardGrid>
  );

  if (isLoading) {
    return <div className={styles.dashboardContainer}>{skeleton}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <DashboardScrollStack accentColor={accentColor} panels={[dashboardDetalhado]} />
    </div>
  );
};

export default VendasPorTipo;
