'use client';

import { useEffect, useRef, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { FaHistory, FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import Button from '@/components/Ui/Button/Button';
import MesSeletor from '@/components/Ui/MesSeletor/MesSeletor';
import useDashboardDate from '@/hooks/useDashboardDate';
import { useDebounce } from '@/hooks/useDebouncer';
import { getPedidosEquipe } from '@/services/portalGerente/pedidosEquipe';
import {
  StatusHistoricoEquipeResponse,
  getStatusHistoricoEquipe,
} from '@/services/portalGerente/statusHistoricoEquipe';
import { getResumoPlanilhaEquipe } from '@/services/portalGerente/resumoPlanilhaEquipe';
import { PedidoPlanilhaProps } from '@/app/(protected)/pedidos-equipe/types';
import { situacaoBadges } from '@/utils/situacaoPedidoPlanilha';
import { notify } from '@/lib/toast/toast';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import { calcularSlaPedido, SlaTier } from '@/utils/slaPedido';
import { iniciaisCliente } from '@/utils/iniciaisCliente';
import { agruparPorPedidoVenda, GrupoPedidoPlanilha } from '@/utils/agruparPedidosPlanilha';
import { LinhaResumoPlanilhaProps } from '@/lib/api/dashboardEquipeDomain';
// Mesmo visual de Meus Pedidos (Portal do Vendedor) — CSS module reaproveitado.
import styles from '@/app/(protected)/meus-pedidos/styles.module.css';
import resumoStyles from './styles.module.css';

const SLA_LABEL_COLOR: Record<SlaTier, string> = {
  atrasado: 'var(--red-light)',
  'vence-hoje': 'var(--red-light)',
  'falta-1-dia': 'var(--red-light)',
  'falta-2-dias': 'var(--red-light)',
  'falta-3-dias': 'var(--red-light)',
  normal: 'var(--foreground-secondary)',
};

const CARD_SLA_CLASS: Partial<Record<SlaTier, string>> = {
  atrasado: styles.cardAtrasado,
  'vence-hoje': styles.cardVenceHoje,
  'falta-1-dia': styles.cardVaiVencer,
  'falta-2-dias': styles.cardVaiVencer,
  'falta-3-dias': styles.cardVaiVencer,
};

const TIER_PRIORIDADE: Record<SlaTier, number> = {
  atrasado: 0,
  'vence-hoje': 1,
  'falta-1-dia': 2,
  'falta-2-dias': 3,
  'falta-3-dias': 4,
  normal: 5,
};

// Card agrupa vários parciais — o destaque visual do card inteiro segue o
// parcial mais urgente do grupo (ex.: 1 parcial atrasado já pinta o card
// mesmo que os outros 3 estejam faturados/ok).
function piorSlaGrupo(grupo: GrupoPedidoPlanilha) {
  let pior: ReturnType<typeof calcularSlaPedido> = null;
  for (const parcial of grupo.parciais) {
    const sla = calcularSlaPedido(parcial.data_previsao, parcial.faturado);
    if (sla && (!pior || TIER_PRIORIDADE[sla.tier] < TIER_PRIORIDADE[pior.tier])) {
      pior = sla;
    }
  }
  return pior;
}

function corCardSla(grupo: GrupoPedidoPlanilha): string {
  const sla = piorSlaGrupo(grupo);
  if (!sla) return '';
  return CARD_SLA_CLASS[sla.tier] ?? '';
}

function slaLabel(pedido: PedidoPlanilhaProps): { texto: string; cor: string } | null {
  const sla = calcularSlaPedido(pedido.data_previsao, pedido.faturado);
  if (!sla) return null;
  return { texto: sla.texto, cor: SLA_LABEL_COLOR[sla.tier] };
}

function corBordaParcial(pedido: PedidoPlanilhaProps): string {
  const sla = calcularSlaPedido(pedido.data_previsao, pedido.faturado);
  if (pedido.faturado) return 'var(--green)';
  if (pedido.cancelado || pedido.denegado) return 'var(--foreground-secondary)';
  if (!sla) return 'transparent';
  return SLA_LABEL_COLOR[sla.tier];
}

type FlagSituacao =
  | 'autorizado'
  | 'denegado'
  | 'faturado'
  | 'cancelado'
  | 'devolvido'
  | 'devolucao_parcial'
  | 'encerrado';

type FiltroSla = 'atrasado' | 'vence-hoje' | 'vai-vencer' | 'em-dia';

// Clique numa linha de dedução do resumo (Cancelado/Devolvido/Devolvido
// parcialmente/Recusado) filtra a lista abaixo pelos mesmos pedidos — só dá
// pra mapear os grupos que batem 1:1 com uma flag booleana aceita por
// /vendas_planilha. G4 (Aços Vital Chile), G5 (Aços Vital Vendedor) e G6
// (Refaturamento) não têm flag equivalente na API hoje, por isso ficam de
// fora e continuam não-clicáveis.
const GRUPO_PARA_FILTRO: Partial<Record<string, FlagSituacao>> = {
  G1: 'cancelado',
  G2: 'devolvido',
  G2P: 'devolucao_parcial',
  G3: 'denegado',
};

// Prazo (SLA) não é uma coluna da view — é calculado no frontend a partir de
// data_previsao/faturado (ver utils/slaPedido.ts), então esse filtro não dá
// pra mandar como query param pro backend como os outros: precisa buscar o
// mês inteiro e filtrar aqui (mesmo raciocínio já usado no resumo do mês).
function pedidoCombinaFiltroSla(pedido: PedidoPlanilhaProps, filtro: FiltroSla): boolean {
  const sla = calcularSlaPedido(pedido.data_previsao, pedido.faturado);
  if (!sla) return false;
  if (filtro === 'atrasado') return sla.tier === 'atrasado';
  if (filtro === 'vence-hoje') return sla.tier === 'vence-hoje';
  if (filtro === 'vai-vencer') {
    return sla.tier === 'falta-1-dia' || sla.tier === 'falta-2-dias' || sla.tier === 'falta-3-dias';
  }
  return sla.tier === 'normal';
}

// Etapa ainda não tem descrição textual (a view devolve só o número) — o DBA
// vai trocar isso por texto em breve; até lá o filtro mostra o número cru
// mesmo, como pedido pelo Nathan.
const ETAPAS = ['0', '10', '20', '60', '70', '80'];

const FILTROS_SITUACAO = [
  {
    key: 'situacao_flag',
    label: 'Situação',
    options: [
      { value: 'faturado', label: 'Faturado' },
      { value: 'autorizado', label: 'Autorizado' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'denegado', label: 'Denegado' },
      { value: 'devolvido', label: 'Devolvido' },
      { value: 'devolucao_parcial', label: 'Devolução parcial' },
      { value: 'encerrado', label: 'Encerrado' },
    ],
  },
  {
    key: 'etapa',
    label: 'Etapa',
    options: ETAPAS.map((etapa) => ({ value: etapa, label: `Etapa ${etapa}` })),
  },
  {
    key: 'sla',
    label: 'Prazo',
    options: [
      { value: 'atrasado', label: 'Atrasado' },
      { value: 'vence-hoje', label: 'Vence hoje' },
      { value: 'vai-vencer', label: 'Vai vencer (até 3 dias)' },
      { value: 'em-dia', label: 'Em dia' },
    ],
  },
];

export default function PedidosEquipe() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PedidoPlanilhaProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [situacaoFiltro, setSituacaoFiltro] = useState<FlagSituacao | ''>('');
  const [etapaFiltro, setEtapaFiltro] = useState('');
  const [slaFiltro, setSlaFiltro] = useState<FiltroSla | ''>('');
  const [exportando, setExportando] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState<number | null>(null);
  const [historicoPorPedido, setHistoricoPorPedido] = useState<
    Record<number, StatusHistoricoEquipeResponse>
  >({});
  const [carregandoHistorico, setCarregandoHistorico] = useState<number | null>(null);
  const [resumoMes, setResumoMes] = useState({ total: 0, atrasados: 0, faturados: 0 });
  const [resumoPlanilha, setResumoPlanilha] = useState<LinhaResumoPlanilhaProps[]>([]);
  const { completeDate } = useDashboardDate();
  const listaRef = useRef<HTMLDivElement>(null);

  function selecionarFiltroPorGrupo(grupo: string | null) {
    const flag = grupo ? GRUPO_PARA_FILTRO[grupo] : undefined;
    if (!flag) return;
    setSituacaoFiltro((atual) => (atual === flag ? '' : flag));
    setPage(0);
    listaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function alternarHistorico(codigoPedidoOmie: number) {
    if (historicoAberto === codigoPedidoOmie) {
      setHistoricoAberto(null);
      return;
    }
    setHistoricoAberto(codigoPedidoOmie);
    if (historicoPorPedido[codigoPedidoOmie]) return;
    setCarregandoHistorico(codigoPedidoOmie);
    try {
      const resposta = await getStatusHistoricoEquipe(codigoPedidoOmie);
      setHistoricoPorPedido((prev) => ({ ...prev, [codigoPedidoOmie]: resposta }));
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoHistorico(null);
    }
  }

  // Aba 1 espelha o registro CRU de /vendas_planilha, campo por campo, na
  // MESMA ORDEM da interface PedidoPlanilhaProps (que por sua vez espelha a
  // ordem da API) — nada de recorte/reformatação, é o dado como vem.
  function paraLinhaPlanilhaCrua(p: PedidoPlanilhaProps) {
    return {
      codigo_pedido_omie: p.codigo_pedido_omie,
      codigo_empresa: p.codigo_empresa,
      is_track_record: p.is_track_record,
      data_inclusao: p.data_inclusao,
      hora_inclusao: p.hora_inclusao,
      pedido_venda: p.pedido_venda,
      nota_fiscal: p.nota_fiscal,
      destinatario: p.destinatario,
      cnpj_cpf_destinatario: p.cnpj_cpf_destinatario,
      situacao: p.situacao,
      codigo_categoria: p.codigo_categoria,
      categoria: p.categoria,
      codigo_vendedor: p.codigo_vendedor,
      vendedor: p.vendedor,
      total_pedido_venda: p.total_pedido_venda,
      manifestacao_destinatario: p.manifestacao_destinatario,
      pedido: p.pedido,
      obs_pedido: p.obs_pedido,
      numero_contrato: p.numero_contrato,
      sequencial: p.sequencial,
      etapa: p.etapa,
      data_previsao: p.data_previsao,
      data_faturamento: p.data_faturamento,
      hora_faturamento: p.hora_faturamento,
      data_cancelamento: p.data_cancelamento,
      data_encerramento: p.data_encerramento,
      codigo_cliente: p.codigo_cliente,
      razao_social_destinatario: p.razao_social_destinatario,
      cidade_destinatario: p.cidade_destinatario,
      estado_destinatario: p.estado_destinatario,
      codigo_projeto: p.codigo_projeto,
      filial_vendedor: p.filial_vendedor,
      autorizado: p.autorizado,
      denegado: p.denegado,
      faturado: p.faturado,
      cancelado: p.cancelado,
      devolvido: p.devolvido,
      devolucao_parcial: p.devolucao_parcial,
      encerrado: p.encerrado,
      manual: p.manual,
      deleted_at: p.deleted_at,
    };
  }

  // Aba 2 é o mesmo resumo (waterfall Bruto → Deduções → Líquido) já
  // consolidado na tela — não busca de novo, exporta o que está no estado.
  function paraLinhaResumo(linha: LinhaResumoPlanilhaProps) {
    return {
      ordem: linha.ordem,
      secao: linha.secao,
      tipo: linha.tipo,
      rotulo: linha.rotulo,
      grupo: linha.grupo,
      valor: linha.valor,
      qtd_pedidos: linha.qtdPedidos,
      pct_total: linha.pctTotal,
    };
  }

  async function exportarExcel() {
    setExportando(true);
    try {
      const resposta = await getPedidosEquipe({
        page: 1,
        limit: 1000,
        numero_pedido: search || undefined,
        data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
        data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
        etapa: etapaFiltro || undefined,
        ...(situacaoFiltro ? { [situacaoFiltro]: true } : {}),
      });
      const pedidos = (resposta.data ?? []).filter((p) =>
        slaFiltro ? pedidoCombinaFiltroSla(p, slaFiltro) : true
      );

      const wb = XLSX.utils.book_new();
      const wsPedidos = XLSX.utils.json_to_sheet(pedidos.map(paraLinhaPlanilhaCrua));
      XLSX.utils.book_append_sheet(wb, wsPedidos, 'Vendas Planilha');
      const wsResumo = XLSX.utils.json_to_sheet(resumoPlanilha.map(paraLinhaResumo));
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
      XLSX.writeFile(wb, `pedidos-equipe-${completeDate.format('YYYY-MM')}.xlsx`);
    } catch (err) {
      console.error(err);
      notify.error('Erro ao exportar pedidos');
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const paramsComuns = {
          numero_pedido: search || undefined,
          data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
          data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
          etapa: etapaFiltro || undefined,
          ...(situacaoFiltro ? { [situacaoFiltro]: true } : {}),
        };

        if (slaFiltro) {
          // Prazo é calculado no frontend, então não dá pra paginar no
          // backend com esse filtro ativo — busca o mês inteiro (mesmo
          // limite usado no resumo/export) e pagina aqui.
          const resposta = await getPedidosEquipe({ page: 1, limit: 1000, ...paramsComuns });
          const filtrados = (resposta.data ?? []).filter((p) => pedidoCombinaFiltroSla(p, slaFiltro));
          setRowCount(filtrados.length);
          setRows(filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage));
        } else {
          const resposta = await getPedidosEquipe({ page: page + 1, limit: rowsPerPage, ...paramsComuns });
          setRows(resposta.data ?? []);
          setRowCount(resposta.total ?? 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [page, rowsPerPage, search, situacaoFiltro, etapaFiltro, slaFiltro, completeDate]);

  useEffect(() => {
    async function carregarResumo() {
      try {
        const resposta = await getPedidosEquipe({
          page: 1,
          limit: 1000,
          data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
          data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
        });
        const pedidos = resposta.data ?? [];
        const atrasados = pedidos.filter(
          (p) => calcularSlaPedido(p.data_previsao, p.faturado)?.tier === 'atrasado'
        ).length;
        const faturados = pedidos.filter((p) => p.faturado).length;
        setResumoMes({ total: resposta.total ?? pedidos.length, atrasados, faturados });
      } catch (err) {
        console.error(err);
      }
    }
    carregarResumo();
  }, [completeDate]);

  useEffect(() => {
    async function carregarResumoPlanilha() {
      try {
        const resposta = await getResumoPlanilhaEquipe({
          mes: completeDate.month() + 1,
          ano: completeDate.year(),
        });
        setResumoPlanilha(resposta.data ?? []);
      } catch (err) {
        console.error(err);
      }
    }
    carregarResumoPlanilha();
  }, [completeDate]);

  return (
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader
          title="Pedidos da Equipe"
          subtitle="Todos os pedidos de todos os vendedores, sem filtro (dados crus)"
        />
        <MesSeletor />
      </div>
      <PageContent>
        <div className={styles.resumoMes}>
          <div className={styles.resumoItem}>
            <span className={styles.resumoValor}>{resumoMes.total}</span>
            <span className={styles.resumoLabel}>pedido{resumoMes.total === 1 ? '' : 's'} no mês</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={`${styles.resumoValor} ${styles.resumoValorOk}`}>{resumoMes.faturados}</span>
            <span className={styles.resumoLabel}>faturado{resumoMes.faturados === 1 ? '' : 's'}</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={`${styles.resumoValor} ${styles.resumoValorAlerta}`}>
              {resumoMes.atrasados}
            </span>
            <span className={styles.resumoLabel}>atrasado{resumoMes.atrasados === 1 ? '' : 's'}</span>
          </div>
        </div>
        {resumoPlanilha.length > 0 && (
          <div className={resumoStyles.resumoPlanilha}>
            <div className={resumoStyles.resumoPlanilhaTitulo}>
              Composição das vendas do mês (Bruto → Deduções → Líquido)
            </div>
            {resumoPlanilha.map((linha) => {
              const flag = linha.grupo ? GRUPO_PARA_FILTRO[linha.grupo] : undefined;
              const clicavel = Boolean(flag);
              const ativa = clicavel && situacaoFiltro === flag;
              return (
                <div
                  key={linha.ordem}
                  className={`${resumoStyles.resumoPlanilhaLinha} ${
                    linha.tipo === 'bruto'
                      ? resumoStyles.resumoPlanilhaBruto
                      : linha.tipo === 'deducao'
                        ? resumoStyles.resumoPlanilhaDeducao
                        : linha.tipo === 'total_deducoes'
                          ? resumoStyles.resumoPlanilhaTotalDeducoes
                          : linha.tipo === 'liquido'
                            ? resumoStyles.resumoPlanilhaLiquido
                            : ''
                  } ${clicavel ? resumoStyles.resumoPlanilhaClicavel : ''} ${
                    ativa ? resumoStyles.resumoPlanilhaAtiva : ''
                  }`}
                  onClick={clicavel ? () => selecionarFiltroPorGrupo(linha.grupo) : undefined}
                  title={clicavel ? 'Ver esses pedidos na lista abaixo' : undefined}
                >
                  <span className={resumoStyles.resumoPlanilhaRotulo}>{linha.rotulo}</span>
                  <span className={resumoStyles.resumoPlanilhaValores}>
                    {linha.qtdPedidos !== null && (
                      <span className={resumoStyles.resumoPlanilhaQtd}>
                        {linha.qtdPedidos} pedido{linha.qtdPedidos === 1 ? '' : 's'}
                      </span>
                    )}
                    <span className={resumoStyles.resumoPlanilhaValor}>{toBRL(linha.valor)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div ref={listaRef} className={`${styles.tableCard} ${resumoStyles.tableCardComResumo}`}>
          <SearchFilterBar
            searchValue={searchInput}
            onSearchChange={(value) => {
              setSearchInput(value);
              setPage(0);
            }}
            searchPlaceholder="Buscar por número do pedido..."
            filters={FILTROS_SITUACAO}
            activeValues={{
              situacao_flag: situacaoFiltro || undefined,
              etapa: etapaFiltro || undefined,
              sla: slaFiltro || undefined,
            }}
            onFilterChange={(key, value) => {
              if (key === 'situacao_flag') {
                setSituacaoFiltro((value as FlagSituacao | null) ?? '');
                setPage(0);
              }
              if (key === 'etapa') {
                setEtapaFiltro(value ?? '');
                setPage(0);
              }
              if (key === 'sla') {
                setSlaFiltro((value as FiltroSla | null) ?? '');
                setPage(0);
              }
            }}
            actions={
              <Button variant="secondary" icon={<FaFileExport />} disabled={exportando} onClick={exportarExcel}>
                {exportando ? 'Exportando...' : 'Exportar Excel'}
              </Button>
            }
            glass
          />
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : rows.length === 0 ? (
            <p className={styles.emptyList}>Nenhum pedido encontrado neste mês.</p>
          ) : (
            <div className={`${styles.listWrapper} ${resumoStyles.listWrapperComResumo}`}>
              {agruparPorPedidoVenda(rows).map((grupo) => {
                // Pedido sem parciais múltiplos: mantém o card compacto de
                // sempre (1 linha de fatos), sem a caixa aninhada — que só
                // compensa quando há de fato mais de 1 sequencial pra
                // detalhar. A maioria dos pedidos do mês é assim, e empilhar
                // uma caixa extra em cada um reduzia demais a densidade da
                // lista (poucos cards visíveis por tela).
                if (grupo.parciais.length === 1) {
                  const pedido = grupo.parciais[0];
                  const badges = situacaoBadges(pedido);
                  const sla = slaLabel(pedido);
                  const omie = pedido.codigo_pedido_omie;
                  return (
                    <div key={grupo.chave} className={`${styles.orderCard} ${corCardSla(grupo)}`}>
                      <div className={styles.orderHead}>
                        <div className={styles.orderAvatar}>{iniciaisCliente(grupo.cliente)}</div>
                        <div className={styles.orderTitles}>
                          <div className={styles.orderClient}>{grupo.cliente}</div>
                          <div className={styles.orderRef}>
                            Pedido {grupo.pedidoVenda}
                            {grupo.vendedor && ` · ${grupo.vendedor}`}
                            {grupo.numeroContrato && ` · ${grupo.numeroContrato}`}
                          </div>
                        </div>
                        <div className={styles.orderValueCol}>
                          <div className={styles.orderValue}>
                            <span className={styles.orderValueCur}>R$</span>
                            <span className={styles.orderValueNum}>
                              {toBRL(grupo.valorTotal).replace(/^R\$\s?/, '')}
                            </span>
                          </div>
                          {sla && !badges.length && (
                            <span className={styles.orderStatusLabel} style={{ color: sla.cor }}>
                              {sla.texto}
                            </span>
                          )}
                        </div>
                      </div>
                      {badges.length > 0 && (
                        <div className={styles.orderFacts} style={{ paddingTop: 0 }}>
                          {badges.map((b) => (
                            <span
                              key={b.chave}
                              className={styles.fact}
                              style={{ color: b.cor, fontWeight: 'var(--w-bold)' }}
                            >
                              {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={styles.orderFacts}>
                        <span className={styles.fact}>
                          Incluído <b>{pedido.data_inclusao ? dateFormatter(pedido.data_inclusao) : '—'}</b>
                        </span>
                        {pedido.data_previsao && (
                          <span className={styles.fact}>
                            Previsão de faturamento <b>{dateFormatter(pedido.data_previsao)}</b>
                          </span>
                        )}
                        {pedido.data_faturamento && (
                          <span className={styles.fact}>
                            Faturado em <b>{dateFormatter(pedido.data_faturamento)}</b>
                          </span>
                        )}
                        {pedido.faturado && pedido.nota_fiscal && (
                          <span className={styles.fact}>
                            NF <b>{pedido.nota_fiscal}</b>
                          </span>
                        )}
                        {pedido.categoria && (
                          <span className={styles.fact}>
                            Categoria <b>{pedido.categoria}</b>
                          </span>
                        )}
                        {pedido.etapa !== null && (
                          <span className={styles.fact}>
                            Etapa <b>{pedido.etapa}</b>
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.historicoBtn}
                          onClick={() => alternarHistorico(omie)}
                        >
                          <FaHistory />
                          {historicoAberto === omie ? 'Ocultar histórico' : 'Ver histórico'}
                        </button>
                      </div>
                      {historicoAberto === omie && (
                        <div className={styles.historicoPainel}>
                          {carregandoHistorico === omie ? (
                            <span className={styles.historicoVazio}>Carregando...</span>
                          ) : (
                            (() => {
                              const historico = historicoPorPedido[omie]?.historico ?? [];
                              if (historico.length === 0) {
                                return (
                                  <span className={styles.historicoVazio}>
                                    Sem mudanças de status registradas ainda (só captura a partir de
                                    04/09/2026).
                                  </span>
                                );
                              }
                              return historico.map((item, i) => (
                                <div key={i} className={styles.historicoItem}>
                                  <span className={styles.historicoData}>
                                    {dateFormatter(item.detectado_em)}
                                  </span>
                                  <span>
                                    {item.situacao_anterior ? (
                                      <>
                                        <b>{item.situacao_anterior}</b> → <b>{item.situacao_nova}</b>
                                      </>
                                    ) : (
                                      <>
                                        Criado como <b>{item.situacao_nova}</b>
                                      </>
                                    )}
                                  </span>
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={grupo.chave} className={`${styles.orderCard} ${corCardSla(grupo)}`}>
                    <div className={styles.orderHead}>
                      <div className={styles.orderAvatar}>{iniciaisCliente(grupo.cliente)}</div>
                      <div className={styles.orderTitles}>
                        <div className={styles.orderClient}>{grupo.cliente}</div>
                        <div className={styles.orderRef}>
                          Pedido {grupo.pedidoVenda}
                          {grupo.vendedor && ` · ${grupo.vendedor}`}
                          {grupo.numeroContrato && ` · ${grupo.numeroContrato}`}
                          {` · ${grupo.parciais.length} parciais`}
                        </div>
                      </div>
                      <div className={styles.orderValueCol}>
                        <div className={styles.orderValue}>
                          <span className={styles.orderValueCur}>R$</span>
                          <span className={styles.orderValueNum}>
                            {toBRL(grupo.valorTotal).replace(/^R\$\s?/, '')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={resumoStyles.parciaisList}>
                      {grupo.parciais.map((parcial) => {
                      const badges = situacaoBadges(parcial);
                      const sla = slaLabel(parcial);
                      const omie = parcial.codigo_pedido_omie;
                      return (
                        <div
                          key={omie}
                          className={resumoStyles.parcialRow}
                          style={{ borderLeftColor: corBordaParcial(parcial) }}
                        >
                          <div className={resumoStyles.parcialHead}>
                            <span className={resumoStyles.parcialLabel}>
                              Parcial {parcial.sequencial ?? 0}
                            </span>
                            {badges.length > 0 ? (
                              <div className={resumoStyles.parcialBadges}>
                                {badges.map((b) => (
                                  <span
                                    key={b.chave}
                                    className={resumoStyles.parcialBadge}
                                    style={{ color: b.cor }}
                                  >
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              sla && (
                                <span className={resumoStyles.parcialBadge} style={{ color: sla.cor }}>
                                  {sla.texto}
                                </span>
                              )
                            )}
                            <span className={resumoStyles.parcialValor}>
                              {toBRL(parcial.total_pedido_venda)}
                            </span>
                          </div>
                          <div className={resumoStyles.parcialFacts}>
                            <span>
                              Incluído{' '}
                              <b>{parcial.data_inclusao ? dateFormatter(parcial.data_inclusao) : '—'}</b>
                            </span>
                            {parcial.data_previsao && (
                              <span>
                                Previsão <b>{dateFormatter(parcial.data_previsao)}</b>
                              </span>
                            )}
                            {parcial.data_faturamento && (
                              <span>
                                Faturado em <b>{dateFormatter(parcial.data_faturamento)}</b>
                              </span>
                            )}
                            {parcial.faturado && parcial.nota_fiscal && (
                              <span className={resumoStyles.parcialNota}>NF {parcial.nota_fiscal}</span>
                            )}
                            {parcial.categoria && (
                              <span>
                                Categoria <b>{parcial.categoria}</b>
                              </span>
                            )}
                            {parcial.etapa !== null && (
                              <span>
                                Etapa <b>{parcial.etapa}</b>
                              </span>
                            )}
                            <button
                              type="button"
                              className={styles.historicoBtn}
                              onClick={() => alternarHistorico(omie)}
                            >
                              <FaHistory />
                              {historicoAberto === omie ? 'Ocultar histórico' : 'Ver histórico'}
                            </button>
                          </div>
                          {historicoAberto === omie && (
                            <div className={styles.historicoPainel}>
                              {carregandoHistorico === omie ? (
                                <span className={styles.historicoVazio}>Carregando...</span>
                              ) : (
                                (() => {
                                  const historico = historicoPorPedido[omie]?.historico ?? [];
                                  if (historico.length === 0) {
                                    return (
                                      <span className={styles.historicoVazio}>
                                        Sem mudanças de status registradas ainda (só captura a partir de
                                        04/09/2026).
                                      </span>
                                    );
                                  }
                                  return historico.map((item, i) => (
                                    <div key={i} className={styles.historicoItem}>
                                      <span className={styles.historicoData}>
                                        {dateFormatter(item.detectado_em)}
                                      </span>
                                      <span>
                                        {item.situacao_anterior ? (
                                          <>
                                            <b>{item.situacao_anterior}</b> → <b>{item.situacao_nova}</b>
                                          </>
                                        ) : (
                                          <>
                                            Criado como <b>{item.situacao_nova}</b>
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  ));
                                })()
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            count={rowCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={setPage}
            onRowsPerPageChange={(rpp) => {
              setRowsPerPage(rpp);
              setPage(0);
            }}
          />
        </div>
      </PageContent>
    </div>
  );
}
