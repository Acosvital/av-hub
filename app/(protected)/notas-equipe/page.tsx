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
import { getNotasEquipe } from '@/services/portalGerente/notasEquipe';
import { getResumoFaturamentoPlanilhaEquipe } from '@/services/portalGerente/resumoFaturamentoPlanilhaEquipe';
import {
  StatusHistoricoEquipeResponse,
  getStatusHistoricoEquipe,
} from '@/services/portalGerente/statusHistoricoEquipe';
import { NotaPlanilhaProps } from '@/app/(protected)/notas-equipe/types';
import { situacaoBadgesNota } from '@/utils/situacaoNotaPlanilha';
import { notify } from '@/lib/toast/toast';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import { iniciaisCliente } from '@/utils/iniciaisCliente';
import { LinhaResumoFaturamentoProps } from '@/lib/api/dashboardEquipeDomain';
// Mesmo visual de Minhas Notas Fiscais (Portal do Vendedor) — CSS module reaproveitado.
import styles from '@/app/(protected)/minhas-notas/styles.module.css';
import resumoStyles from './styles.module.css';

type FlagSituacaoNota =
  | 'denegado'
  | 'faturado'
  | 'cancelado'
  | 'devolvido'
  | 'devolucao_parcial'
  | 'manual_nf';

// Clique numa linha de dedução do resumo (Cancelado/Devolvido/Devolvido
// parcialmente/Recusado) filtra a lista abaixo pelas mesmas notas — só dá pra
// mapear os grupos que batem 1:1 com uma flag booleana aceita por
// /faturamento_planilha (ver FLAGS_BOOLEANAS em app/api/notas-equipe/route.ts).
// G4 (Aços Vital Chile), G5 (Aços Vital Vendedor) e G6 (Refaturamento) não têm
// flag equivalente na API hoje, por isso ficam de fora e continuam não-clicáveis.
const GRUPO_PARA_FILTRO: Partial<Record<string, FlagSituacaoNota>> = {
  G1: 'cancelado',
  G2: 'devolvido',
  G2P: 'devolucao_parcial',
  G3: 'denegado',
};

// /faturamento_planilha só filtra estas flags (ver app/api/notas-equipe/route.ts).
const FILTROS_SITUACAO = [
  {
    key: 'situacao_flag',
    label: 'Situação',
    options: [
      { value: 'faturado', label: 'Faturado' },
      { value: 'cancelado', label: 'Cancelado' },
      { value: 'denegado', label: 'Denegado' },
      { value: 'devolvido', label: 'Devolvido' },
      { value: 'devolucao_parcial', label: 'Devolução parcial' },
      { value: 'manual_nf', label: 'Manual' },
    ],
  },
];

export default function NotasEquipe() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<NotaPlanilhaProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [situacaoFiltro, setSituacaoFiltro] = useState<FlagSituacaoNota | ''>('');
  const [exportando, setExportando] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState<number | null>(null);
  const [historicoPorPedido, setHistoricoPorPedido] = useState<
    Record<number, StatusHistoricoEquipeResponse>
  >({});
  const [carregandoHistorico, setCarregandoHistorico] = useState<number | null>(null);
  const [resumoPlanilha, setResumoPlanilha] = useState<LinhaResumoFaturamentoProps[]>([]);
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

  // Aba 1 espelha o registro CRU de /faturamento_planilha, campo por campo,
  // na MESMA ORDEM da interface NotaPlanilhaProps (que espelha a ordem da
  // API) — nada de recorte/reformatação, é o dado como vem.
  function paraLinhaFaturamentoCrua(n: NotaPlanilhaProps) {
    return {
      codigo_nf_omie: n.codigo_nf_omie,
      codigo_empresa: n.codigo_empresa,
      is_track_record: n.is_track_record,
      data_emissao: n.data_emissao,
      hora_emissao: n.hora_emissao,
      nota_fiscal: n.nota_fiscal,
      cfop: n.cfop,
      destinatario: n.destinatario,
      nome_fantasia_destinatario: n.nome_fantasia_destinatario,
      cnpj_cpf_destinatario: n.cnpj_cpf_destinatario,
      codigo_categoria_nf: n.codigo_categoria_nf,
      categoria_nf: n.categoria_nf,
      codigo_categoria_pedido: n.codigo_categoria_pedido,
      categoria_pedido: n.categoria_pedido,
      codigo_vendedor: n.codigo_vendedor,
      vendedor: n.vendedor,
      filial_vendedor: n.filial_vendedor,
      total_mercadoria: n.total_mercadoria,
      valor_itens: n.valor_itens,
      desconto: n.desconto,
      valor_ipi: n.valor_ipi,
      total_nota_fiscal: n.total_nota_fiscal,
      valor_nao_permitido: n.valor_nao_permitido,
      total_nota_fiscal_ajustado: n.total_nota_fiscal_ajustado,
      valor_icms_st: n.valor_icms_st,
      frete: n.frete,
      seguro: n.seguro,
      outras_despesas: n.outras_despesas,
      impostos_aprox_federais: n.impostos_aprox_federais,
      impostos_aprox_estaduais: n.impostos_aprox_estaduais,
      impostos_aprox_municipais: n.impostos_aprox_municipais,
      valor_icms: n.valor_icms,
      valor_pis: n.valor_pis,
      valor_cofins: n.valor_cofins,
      valor_fcp_icms: n.valor_fcp_icms,
      valor_fcp_icms_st: n.valor_fcp_icms_st,
      valor_icms_desonerado: n.valor_icms_desonerado,
      tipo_nf: n.tipo_nf,
      manifestacao_destinatario: n.manifestacao_destinatario,
      pedido: n.pedido,
      obs_pedido: n.obs_pedido,
      numero_contrato: n.numero_contrato,
      refaturamento_tipo_ref: n.refaturamento_tipo_ref,
      refaturamento_num_ref: n.refaturamento_num_ref,
      status_refaturamento: n.status_refaturamento,
      codigo_pedido_omie: n.codigo_pedido_omie,
      codigo_cliente: n.codigo_cliente,
      chave_nf: n.chave_nf,
      averbado: n.averbado,
      etapa: n.etapa,
      autorizado: n.autorizado,
      denegado: n.denegado,
      faturado: n.faturado,
      cancelado: n.cancelado,
      devolvido: n.devolvido,
      devolucao_parcial: n.devolucao_parcial,
      encerrado: n.encerrado,
      manual_nf: n.manual_nf,
      manual_pedido: n.manual_pedido,
      deleted_at: n.deleted_at,
    };
  }

  // Aba 2 é o mesmo resumo (waterfall Bruto → Deduções → Líquido) já
  // consolidado na tela — não busca de novo, exporta o que está no estado.
  function paraLinhaResumo(linha: LinhaResumoFaturamentoProps) {
    return {
      ordem: linha.ordem,
      secao: linha.secao,
      tipo: linha.tipo,
      rotulo: linha.rotulo,
      grupo: linha.grupo,
      valor: linha.valor,
      qtd_nfs: linha.qtdNfs,
      pct_total: linha.pctTotal,
    };
  }

  async function exportarExcel() {
    setExportando(true);
    try {
      const resposta = await getNotasEquipe({
        page: 1,
        limit: 1000,
        numero_nf: search || undefined,
        data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
        data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
        ...(situacaoFiltro ? { [situacaoFiltro]: true } : {}),
      });
      const notas = resposta.data ?? [];

      const wb = XLSX.utils.book_new();
      const wsNotas = XLSX.utils.json_to_sheet(notas.map(paraLinhaFaturamentoCrua));
      XLSX.utils.book_append_sheet(wb, wsNotas, 'Faturamento Planilha');
      const wsResumo = XLSX.utils.json_to_sheet(resumoPlanilha.map(paraLinhaResumo));
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
      XLSX.writeFile(wb, `notas-equipe-${completeDate.format('YYYY-MM')}.xlsx`);
    } catch (err) {
      console.error(err);
      notify.error('Erro ao exportar notas fiscais');
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const resposta = await getNotasEquipe({
          page: page + 1,
          limit: rowsPerPage,
          numero_nf: search || undefined,
          data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
          data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
          ...(situacaoFiltro ? { [situacaoFiltro]: true } : {}),
        });
        setRows(resposta.data ?? []);
        setRowCount(resposta.total ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [page, rowsPerPage, search, situacaoFiltro, completeDate]);

  useEffect(() => {
    async function carregarResumoPlanilha() {
      try {
        const resposta = await getResumoFaturamentoPlanilhaEquipe({
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
          title="Notas Fiscais da Equipe"
          subtitle="Todas as notas fiscais de todos os vendedores, sem filtro (dados crus)"
        />
        <MesSeletor />
      </div>
      <PageContent>
        {resumoPlanilha.length > 0 && (
          <div className={resumoStyles.resumoPlanilha}>
            <div className={resumoStyles.resumoPlanilhaTitulo}>
              Composição do faturamento do mês (Bruto → Deduções → Líquido)
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
                  title={clicavel ? 'Ver essas notas na lista abaixo' : undefined}
                >
                  <span className={resumoStyles.resumoPlanilhaRotulo}>{linha.rotulo}</span>
                  <span className={resumoStyles.resumoPlanilhaValores}>
                    {linha.qtdNfs !== null && (
                      <span className={resumoStyles.resumoPlanilhaQtd}>
                        {linha.qtdNfs} nota{linha.qtdNfs === 1 ? '' : 's'}
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
            searchPlaceholder="Buscar por número da nota..."
            filters={FILTROS_SITUACAO}
            activeValues={{ situacao_flag: situacaoFiltro || undefined }}
            onFilterChange={(key, value) => {
              if (key === 'situacao_flag') {
                setSituacaoFiltro((value as FlagSituacaoNota | null) ?? '');
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
            <p className={styles.emptyList}>Nenhuma nota fiscal encontrada neste mês.</p>
          ) : (
            <div className={`${styles.listWrapper} ${resumoStyles.listWrapperComResumo}`}>
              {rows.map((nota) => {
                const badges = situacaoBadgesNota(nota);
                const nomeCliente = nota.destinatario ?? nota.nome_fantasia_destinatario ?? '—';
                const omie = nota.codigo_pedido_omie;
                return (
                  <div key={nota.codigo_nf_omie} className={styles.nfCard}>
                    <div className={styles.nfHead}>
                      <div className={styles.nfAvatar}>{iniciaisCliente(nomeCliente)}</div>
                      <div className={styles.nfTitles}>
                        <div className={styles.nfClient}>{nomeCliente}</div>
                        <div className={styles.nfRef}>
                          Nota {nota.nota_fiscal ?? '—'}
                          {nota.pedido && ` · Pedido ${nota.pedido}`}
                          {nota.vendedor && ` · ${nota.vendedor}`}
                          {nota.numero_contrato && ` · ${nota.numero_contrato}`}
                        </div>
                      </div>
                      <div className={styles.nfValueCol}>
                        <div className={styles.nfValue}>
                          <span className={styles.nfValueCur}>R$</span>
                          <span className={styles.nfValueNum}>
                            {toBRL(nota.total_nota_fiscal).replace(/^R\$\s?/, '')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {badges.length > 0 && (
                      <div className={styles.nfFacts} style={{ paddingTop: 0 }}>
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
                    <div className={styles.nfFacts}>
                      <span className={styles.fact}>
                        Emitida <b>{nota.data_emissao ? dateFormatter(nota.data_emissao) : '—'}</b>
                      </span>
                      {(nota.categoria_pedido ?? nota.categoria_nf) && (
                        <span className={styles.fact}>
                          Categoria <b>{nota.categoria_pedido ?? nota.categoria_nf}</b>
                        </span>
                      )}
                      {nota.etapa !== null && (
                        <span className={styles.fact}>
                          Etapa <b>{nota.etapa}</b>
                        </span>
                      )}
                      {nota.status_refaturamento && (
                        <span className={styles.fact}>
                          Refaturamento <b>{nota.status_refaturamento}</b>
                        </span>
                      )}
                      {omie !== null && (
                        <button
                          type="button"
                          className={resumoStyles.historicoBtn}
                          onClick={() => alternarHistorico(omie)}
                        >
                          <FaHistory />
                          {historicoAberto === omie ? 'Ocultar histórico' : 'Ver histórico'}
                        </button>
                      )}
                    </div>
                    {omie !== null && historicoAberto === omie && (
                      <div className={resumoStyles.historicoPainel}>
                        {carregandoHistorico === omie ? (
                          <span className={resumoStyles.historicoVazio}>Carregando...</span>
                        ) : (
                          (() => {
                            const historico = historicoPorPedido[omie]?.historico ?? [];
                            if (historico.length === 0) {
                              return (
                                <span className={resumoStyles.historicoVazio}>
                                  Sem mudanças de status registradas ainda (só captura a partir de
                                  04/09/2026).
                                </span>
                              );
                            }
                            return historico.map((item, i) => (
                              <div key={i} className={resumoStyles.historicoItem}>
                                <span className={resumoStyles.historicoData}>
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
