'use client';

import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { FaStar, FaRegStar, FaHistory, FaFileExport } from 'react-icons/fa';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import Button from '@/components/Ui/Button/Button';
import MesSeletor from '@/components/Ui/MesSeletor/MesSeletor';
import useDashboardDate from '@/hooks/useDashboardDate';
import { useDebounce } from '@/hooks/useDebouncer';
import { getMeusPedidos } from '@/services/portalVendedor/meusPedidos';
import {
  FavoritoProps,
  criarFavorito,
  getFavoritos,
  removerFavorito,
} from '@/services/portalVendedor/favoritos';
import {
  StatusHistoricoResponse,
  getStatusHistorico,
} from '@/services/portalVendedor/statusHistorico';
import { PedidoVendedorProps } from './types';
import { notify } from '@/lib/toast/toast';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import TIPO_CONTRATO_COLORS from '@/utils/tipoContratoColors';
import { GRUPO_LABEL_PEDIDO, GRUPO_COLOR_PEDIDO } from '@/utils/grupoPedidoClassificacao';
import { calcularSlaPedido, SlaTier } from '@/utils/slaPedido';
import { iniciaisCliente } from '@/utils/iniciaisCliente';
import styles from './styles.module.css';

// Cor do rótulo de urgência (texto simples, não selo cheio — o card inteiro
// já vira vermelho nos 3 níveis mais urgentes, ver CARD_SLA_CLASS; um selo
// cheio por cima brigaria com o fundo). "normal" (4+ dias) não tem urgência
// nenhuma, cor neutra.
// --danger (não --red-light): o selo fica sobre o card já tingido de
// vermelho (.cardAtrasado/.cardVaiVencer/.cardVenceHoje em
// styles.module.css) — --red-light é pálido demais pra qualquer um dos
// dois temas ler bem em cima desse tingimento, --danger (já theme-aware)
// resolve os dois.
const SLA_LABEL_COLOR: Record<SlaTier, string> = {
  atrasado: 'var(--danger)',
  'vence-hoje': 'var(--danger)',
  'falta-1-dia': 'var(--danger)',
  'falta-2-dias': 'var(--danger)',
  'falta-3-dias': 'var(--danger)',
  normal: 'var(--foreground-secondary)',
};

// Destaque do CARD inteiro (não só do selinho de SLA) — pedido explícito:
// atrasado só escurece (sem piscar), vence hoje fica vermelho E pisca (mais
// urgente — ainda dá tempo hoje), "vai vencer" (1-3 dias) fica vermelho sem
// piscar. "normal" (4+ dias) não ganha destaque nenhum no card.
const CARD_SLA_CLASS: Partial<Record<SlaTier, string>> = {
  atrasado: styles.cardAtrasado,
  'vence-hoje': styles.cardVenceHoje,
  'falta-1-dia': styles.cardVaiVencer,
  'falta-2-dias': styles.cardVaiVencer,
  'falta-3-dias': styles.cardVaiVencer,
};

// Badge de status — só aparece pra situações excepcionais (cancelado,
// devolvido, refaturamento, faturado). Pedido "em aberto" não ganha badge,
// só o selo de SLA (ver renderSla). Regra e prioridade batem com
// docs/portal-vendedor/plano-portal-vendedor.md, seção 4.2/4.2.1.
function badgeStatus(pedido: PedidoVendedorProps) {
  if (pedido.grupo && pedido.grupo !== 'LIQUIDO') {
    return {
      label: GRUPO_LABEL_PEDIDO[pedido.grupo] ?? pedido.grupo,
      color: GRUPO_COLOR_PEDIDO[pedido.grupo],
    };
  }
  if (pedido.faturado) return { label: 'Faturado', color: 'var(--green)' };
  return null;
}

// Rótulo único de status sob o valor — antes eram dois selos possivelmente
// simultâneos (badge de grupo/faturado + selo de SLA). Um pedido cancelado/
// devolvido/faturado tem um status definitivo que manda mais que a contagem
// de dias até vencer, por isso a prioridade é badge primeiro, SLA depois.
function statusLabel(pedido: PedidoVendedorProps): { texto: string; cor: string } | null {
  const badge = badgeStatus(pedido);
  if (badge) return { texto: badge.label, cor: badge.color };
  const sla = calcularSlaPedido(pedido.previsao_faturamento, pedido.faturado);
  if (!sla) return null;
  return { texto: sla.texto, cor: SLA_LABEL_COLOR[sla.tier] };
}

function corCardSla(pedido: PedidoVendedorProps): string {
  const sla = calcularSlaPedido(pedido.previsao_faturamento, pedido.faturado);
  if (!sla) return '';
  return CARD_SLA_CLASS[sla.tier] ?? '';
}

const FILTROS_GRUPO = [
  {
    key: 'grupo',
    label: 'Status',
    options: [
      { value: 'G1', label: 'Cancelado' },
      { value: 'G2', label: 'Devolvido' },
      { value: 'G3', label: 'Recusado' },
      { value: 'G6', label: 'Refaturamento' },
      { value: 'LIQUIDO', label: 'Normal' },
    ],
  },
  // Diferente do filtro "Status" acima (grupo_deducao, um parâmetro real
  // aceito por /vendas_base): "situação" (faturado/em aberto) não tem
  // suporte nenhum no backend hoje — testei ao vivo (07/09) mandando
  // `situacao=Faturado`/`situacao=Pendente` pro mesmo endpoint que Meus
  // Pedidos já usa e a resposta veio idêntica nos dois casos, prova de que o
  // parâmetro é ignorado. Por isso esse filtro é 100% cliente: usa o campo
  // `faturado` que cada pedido já traz e pagina em memória (ver `carregar`).
  {
    key: 'situacao_local',
    label: 'Situação',
    options: [
      { value: 'faturado', label: 'Faturado' },
      { value: 'pendente', label: 'Em aberto' },
    ],
  },
];

export default function MeusPedidos() {
  const [loading, setLoading] = useState(true);
  const [vinculado, setVinculado] = useState(true);
  const [rows, setRows] = useState<PedidoVendedorProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState<'' | 'faturado' | 'pendente'>('');
  const [exportando, setExportando] = useState(false);
  const [favoritos, setFavoritos] = useState<FavoritoProps[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState<number | null>(null);
  const [historicoPorPedido, setHistoricoPorPedido] = useState<
    Record<number, StatusHistoricoResponse>
  >({});
  const [carregandoHistorico, setCarregandoHistorico] = useState<number | null>(null);
  const [resumoMes, setResumoMes] = useState({ total: 0, atrasados: 0, faturados: 0 });
  const { completeDate } = useDashboardDate();

  useEffect(() => {
    getFavoritos()
      .then((res) => setFavoritos(res.data ?? []))
      .catch((err) => console.error(err));
  }, []);

  const favoritoDoPedido = (codigoPedidoOmie: number) =>
    favoritos.find((f) => f.tipo === 'pedido' && f.referencia_id === String(codigoPedidoOmie));

  async function alternarFavorito(pedido: PedidoVendedorProps) {
    const existente = favoritoDoPedido(pedido.codigo_pedido_omie);
    try {
      if (existente) {
        await removerFavorito(existente.id);
        setFavoritos((prev) => prev.filter((f) => f.id !== existente.id));
      } else {
        const novo = await criarFavorito(
          'pedido',
          String(pedido.codigo_pedido_omie),
          pedido.codigo_empresa
        );
        setFavoritos((prev) => [...prev, novo]);
      }
    } catch (err) {
      console.error(err);
      notify.error('Não foi possível favoritar agora — tente novamente mais tarde.');
    }
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
      const resposta = await getStatusHistorico(codigoPedidoOmie);
      setHistoricoPorPedido((prev) => ({ ...prev, [codigoPedidoOmie]: resposta }));
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoHistorico(null);
    }
  }

  // Escapa um campo pro formato CSV (RFC 4180): só entra entre aspas quando
  // precisa (contém o delimitador, aspas ou quebra de linha), dobrando aspas
  // internas — do contrário fica sem aspas mesmo, mais legível ao abrir.
  function escaparCsv(campo: string): string {
    if (/[";\n]/.test(campo)) return `"${campo.replace(/"/g, '""')}"`;
    return campo;
  }

  // Exporta o mês inteiro respeitando os filtros ativos (busca/status/
  // situação), não só a página visível — busca de novo com limit alto (mesmo
  // padrão do resumo do mês/situação), igual pediu Nathan.
  async function exportarCsv() {
    setExportando(true);
    try {
      const resposta = await getMeusPedidos({
        page: 1,
        limit: 1000,
        numero_pedido: search || undefined,
        data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
        data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
        grupo: grupoFiltro || undefined,
      });
      const pedidos = (resposta.data ?? []).filter(
        (p) => !situacaoFiltro || (situacaoFiltro === 'faturado' ? p.faturado : !p.faturado)
      );

      const cabecalho = [
        'Cliente',
        'Pedido',
        'Nota Fiscal',
        'Tipo Contrato',
        'Status',
        'Valor',
        'Data Inclusão',
        'Previsão de Faturamento',
      ];
      const linhas = pedidos.map((p) => {
        const nomeCliente = p.nome_cliente ?? p.razao_social_cliente ?? p.codigo_cliente ?? '';
        const status = badgeStatus(p)?.label ?? (p.faturado ? 'Faturado' : 'Em aberto');
        return [
          nomeCliente,
          p.numero_pedido ?? '',
          p.numero_nf ?? '',
          p.tipo_contrato ?? '',
          status,
          p.total_pedido ?? '0',
          p.data_inclusao ? dateFormatter(p.data_inclusao) : '',
          p.previsao_faturamento ? dateFormatter(p.previsao_faturamento) : '',
        ];
      });

      // Delimitador `;` (não `,`) porque o valor já usa vírgula decimal
      // (formato BRL) — Excel em pt-BR também espera `;` como separador de
      // coluna. BOM UTF-8 na frente pra acentos abrirem certo no Excel.
      const csv = [cabecalho, ...linhas]
        .map((linha) => linha.map((campo) => escaparCsv(String(campo))).join(';'))
        .join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-pedidos-${completeDate.format('YYYY-MM')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
          grupo: grupoFiltro || undefined,
        };

        // "Situação" (faturado/em aberto) não existe como filtro no backend
        // (ver comentário em FILTROS_GRUPO) — busca o mês inteiro (já
        // filtrado por busca/grupo, que esses sim o backend aceita) e pagina
        // em memória sobre o resultado filtrado por `faturado`.
        if (situacaoFiltro) {
          const resposta = await getMeusPedidos({ ...paramsComuns, page: 1, limit: 1000 });
          setVinculado(resposta.vinculado);
          const filtrados = (resposta.data ?? []).filter((p) =>
            situacaoFiltro === 'faturado' ? p.faturado : !p.faturado
          );
          setRowCount(filtrados.length);
          setRows(filtrados.slice(page * rowsPerPage, (page + 1) * rowsPerPage));
          return;
        }

        const resposta = await getMeusPedidos({ ...paramsComuns, page: page + 1, limit: rowsPerPage });
        setVinculado(resposta.vinculado);
        setRows(resposta.data ?? []);
        setRowCount(resposta.total ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [page, rowsPerPage, search, grupoFiltro, situacaoFiltro, completeDate]);

  // Resumo do mês (card acima do buscador) — sempre reflete o mês inteiro,
  // independente de busca/filtro de status ativos na lista abaixo. Por isso
  // é uma chamada à parte (sem numero_pedido/grupo), não reaproveita `rows`
  // (que é só a página atual, até 25 itens).
  useEffect(() => {
    async function carregarResumo() {
      try {
        const resposta = await getMeusPedidos({
          page: 1,
          limit: 1000,
          data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
          data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
        });
        const pedidos = resposta.data ?? [];
        const atrasados = pedidos.filter(
          (p) => calcularSlaPedido(p.previsao_faturamento, p.faturado)?.tier === 'atrasado'
        ).length;
        const faturados = pedidos.filter((p) => p.faturado).length;
        setResumoMes({ total: resposta.total ?? pedidos.length, atrasados, faturados });
      } catch (err) {
        console.error(err);
      }
    }
    carregarResumo();
  }, [completeDate]);

  return (
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Meus Pedidos" subtitle="Seus pedidos de venda no mês selecionado" />
        <MesSeletor />
      </div>
      <PageContent>
        {!vinculado ? (
          <div className={styles.emptyState}>
            <p>
              Seu usuário ainda não está vinculado a um vendedor. Fale com o time de acessos para
              configurar esse vínculo.
            </p>
          </div>
        ) : (
          <>
          <div className={styles.resumoMes}>
            <div className={styles.resumoItem}>
              <span className={styles.resumoValor}>{resumoMes.total}</span>
              <span className={styles.resumoLabel}>
                pedido{resumoMes.total === 1 ? '' : 's'} no mês
              </span>
            </div>
            <div className={styles.resumoItem}>
              <span className={`${styles.resumoValor} ${styles.resumoValorOk}`}>
                {resumoMes.faturados}
              </span>
              <span className={styles.resumoLabel}>
                faturado{resumoMes.faturados === 1 ? '' : 's'}
              </span>
            </div>
            <div className={styles.resumoItem}>
              <span className={`${styles.resumoValor} ${styles.resumoValorAlerta}`}>
                {resumoMes.atrasados}
              </span>
              <span className={styles.resumoLabel}>
                atrasado{resumoMes.atrasados === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <div className={styles.tableCard}>
            <SearchFilterBar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                setPage(0);
              }}
              searchPlaceholder="Buscar por número do pedido..."
              filters={FILTROS_GRUPO}
              activeValues={{
                grupo: grupoFiltro || undefined,
                situacao_local: situacaoFiltro || undefined,
              }}
              onFilterChange={(key, value) => {
                if (key === 'grupo') {
                  setGrupoFiltro(value ?? '');
                  setPage(0);
                }
                if (key === 'situacao_local') {
                  setSituacaoFiltro((value as 'faturado' | 'pendente' | null) ?? '');
                  setPage(0);
                }
              }}
              actions={
                <Button
                  variant="secondary"
                  icon={<FaFileExport />}
                  disabled={exportando}
                  onClick={exportarCsv}
                >
                  {exportando ? 'Exportando...' : 'Exportar CSV'}
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
              <div className={styles.listWrapper}>
                {rows.map((pedido) => {
                  const badge = badgeStatus(pedido);
                  const status = statusLabel(pedido);
                  const nomeCliente =
                    pedido.nome_cliente ?? pedido.razao_social_cliente ?? pedido.codigo_cliente ?? '—';
                  return (
                    <div
                      key={pedido.codigo_pedido_omie}
                      className={`${styles.orderCard} ${corCardSla(pedido)}`}
                    >
                      <div className={styles.orderHead}>
                        <div className={styles.orderAvatar}>{iniciaisCliente(nomeCliente)}</div>
                        <div className={styles.orderTitles}>
                          <div className={styles.orderClient}>{nomeCliente}</div>
                          <div className={styles.orderRef}>
                            Pedido {pedido.numero_pedido ?? '—'} ·{' '}
                            <span style={{ color: TIPO_CONTRATO_COLORS[pedido.tipo_contrato ?? 'SEM CLASSIFICAÇÃO'] }}>
                              {pedido.tipo_contrato ?? 'SEM CLASSIFICAÇÃO'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.favoritoBtn}
                          onClick={() => alternarFavorito(pedido)}
                          aria-label={
                            favoritoDoPedido(pedido.codigo_pedido_omie)
                              ? 'Remover dos favoritos'
                              : 'Favoritar pedido'
                          }
                        >
                          {favoritoDoPedido(pedido.codigo_pedido_omie) ? (
                            <FaStar color="var(--gold)" />
                          ) : (
                            <FaRegStar />
                          )}
                        </button>
                        <div className={styles.orderValueCol}>
                          <div className={styles.orderValue}>
                            <span className={styles.orderValueCur}>R$</span>
                            <span className={styles.orderValueNum}>
                              {toBRL(pedido.total_pedido).replace(/^R\$\s?/, '')}
                            </span>
                          </div>
                          {status && (
                            <span className={styles.orderStatusLabel} style={{ color: status.cor }}>
                              {status.texto}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.orderFacts}>
                        <span className={styles.fact}>
                          Incluído <b>{pedido.data_inclusao ? dateFormatter(pedido.data_inclusao) : '—'}</b>
                        </span>
                        {pedido.previsao_faturamento && (
                          <span className={styles.fact}>
                            Previsão de faturamento <b>{dateFormatter(pedido.previsao_faturamento)}</b>
                          </span>
                        )}
                        {pedido.etapa_descricao && (
                          <span className={styles.fact}>
                            Etapa <b>{pedido.etapa_descricao}</b>
                          </span>
                        )}
                        {!badge && pedido.categoria && (
                          <span className={styles.fact}>
                            Categoria <b>{pedido.categoria}</b>
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.historicoBtn}
                          onClick={() => alternarHistorico(pedido.codigo_pedido_omie)}
                        >
                          <FaHistory />
                          {historicoAberto === pedido.codigo_pedido_omie ? 'Ocultar histórico' : 'Ver histórico'}
                        </button>
                      </div>
                      {historicoAberto === pedido.codigo_pedido_omie && (
                        <div className={styles.historicoPainel}>
                          {carregandoHistorico === pedido.codigo_pedido_omie ? (
                            <span className={styles.historicoVazio}>Carregando...</span>
                          ) : (
                            (() => {
                              const historico = historicoPorPedido[pedido.codigo_pedido_omie]?.historico ?? [];
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
          </>
        )}
      </PageContent>
    </div>
  );
}
