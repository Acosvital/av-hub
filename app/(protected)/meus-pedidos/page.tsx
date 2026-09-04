'use client';

import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { FaStar, FaRegStar, FaHistory } from 'react-icons/fa';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
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
import styles from './styles.module.css';

const GRUPO_LABEL: Record<string, string> = {
  G1: 'Cancelado',
  G2: 'Devolvido',
  G3: 'Recusado',
  G4: 'Bloqueado',
  G5: 'Bloqueado',
  G6: 'Refaturamento',
};

const GRUPO_COLOR: Record<string, string> = {
  G1: 'var(--graphite)',
  G2: 'var(--orange)',
  G3: 'var(--red)',
  G4: 'var(--graphite)',
  G5: 'var(--graphite)',
  G6: 'var(--pink)',
};

const STRIPE_COLOR: Record<string, string> = {
  G1: 'var(--graphite)',
  G2: 'var(--orange)',
  G3: 'var(--red)',
  G4: 'var(--graphite)',
  G5: 'var(--graphite)',
  G6: 'var(--pink)',
};

// Badge de status — só aparece pra situações excepcionais (cancelado,
// devolvido, refaturamento, faturado). Pedido "em aberto" não ganha badge,
// só o selo de SLA (ver renderSla). Regra e prioridade batem com
// docs/portal-vendedor/plano-portal-vendedor.md, seção 4.2/4.2.1.
function badgeStatus(pedido: PedidoVendedorProps) {
  if (pedido.grupo && pedido.grupo !== 'LIQUIDO') {
    return { label: GRUPO_LABEL[pedido.grupo] ?? pedido.grupo, color: GRUPO_COLOR[pedido.grupo] };
  }
  if (pedido.faturado) return { label: 'Faturado', color: 'var(--green)' };
  return null;
}

function corStripe(pedido: PedidoVendedorProps) {
  if (pedido.grupo && pedido.grupo !== 'LIQUIDO') return STRIPE_COLOR[pedido.grupo];
  if (pedido.faturado) return 'var(--green)';
  return 'var(--border-strong)';
}

// SLA — seção 5 do plano. Só calcula se `data_previsao` vier preenchido
// e o pedido não estiver faturado.
function renderSla(pedido: PedidoVendedorProps) {
  if (pedido.faturado || !pedido.data_previsao) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const previsao = new Date(pedido.data_previsao);
  previsao.setHours(0, 0, 0, 0);
  const dias = Math.round((previsao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (dias < 0) {
    return {
      className: styles.slaAtrasado,
      texto: `⛔ Atrasado — ${-dias} dia${-dias === 1 ? '' : 's'}`,
    };
  }
  if (dias === 0) return { className: styles.sla1d, texto: '⚠ Vence hoje' };
  if (dias === 1) return { className: styles.sla1d, texto: '⚠ Falta 1 dia' };
  if (dias === 2) return { className: styles.sla2d, texto: `Faltam ${dias} dias` };
  if (dias === 3) return { className: styles.sla3d, texto: `Faltam ${dias} dias` };
  return { className: styles.slaNormal, texto: `Previsão em ${dias} dias` };
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
  const [favoritos, setFavoritos] = useState<FavoritoProps[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState<number | null>(null);
  const [historicoPorPedido, setHistoricoPorPedido] = useState<
    Record<number, StatusHistoricoResponse>
  >({});
  const [carregandoHistorico, setCarregandoHistorico] = useState<number | null>(null);
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

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const resposta = await getMeusPedidos({
          page: page + 1,
          limit: rowsPerPage,
          numero_pedido: search || undefined,
          data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
          data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
          grupo: grupoFiltro || undefined,
        });
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
  }, [page, rowsPerPage, search, grupoFiltro, completeDate]);

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
          <div className={styles.tableCard}>
            <SearchFilterBar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                setPage(0);
              }}
              searchPlaceholder="Buscar por número do pedido..."
              filters={FILTROS_GRUPO}
              activeValues={{ grupo: grupoFiltro || undefined }}
              onFilterChange={(key, value) => {
                if (key === 'grupo') {
                  setGrupoFiltro(value ?? '');
                  setPage(0);
                }
              }}
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
                  const sla = renderSla(pedido);
                  return (
                    <div
                      key={pedido.codigo_pedido_omie}
                      className={styles.orderCard}
                      style={{ '--stripe': corStripe(pedido) } as React.CSSProperties}
                    >
                      <div className={styles.orderTop}>
                        <div className={styles.orderIdRow}>
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
                          <div>
                            <div className={styles.orderId}>Pedido nº {pedido.numero_pedido ?? '—'}</div>
                            <div className={styles.orderClient}>
                              {pedido.nome_cliente ?? pedido.razao_social_cliente ?? pedido.codigo_cliente ?? '—'}
                            </div>
                          </div>
                        </div>
                        <div className={styles.orderValueCol}>
                          <div className={styles.orderValue}>{toBRL(pedido.total_pedido)}</div>
                          {sla && (
                            <span className={`${styles.sla} ${sla.className}`}>
                              <span className={styles.slaDot} />
                              {sla.texto}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.badges}>
                        <span
                          className={styles.badge}
                          style={{
                            backgroundColor: TIPO_CONTRATO_COLORS[pedido.tipo_contrato ?? 'SEM CLASSIFICAÇÃO'],
                            color: 'var(--white)',
                          }}
                        >
                          {pedido.tipo_contrato ?? 'SEM CLASSIFICAÇÃO'}
                        </span>
                        {badge && (
                          <span
                            className={styles.badge}
                            style={{ backgroundColor: badge.color, color: 'var(--white)' }}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      {!badge && (
                        <div className={styles.orderMeta}>
                          <span>
                            Incluído em <b>{pedido.data_inclusao ? dateFormatter(pedido.data_inclusao) : '—'}</b>
                          </span>
                          {pedido.categoria && (
                            <span>
                              Categoria <b>{pedido.categoria}</b>
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.historicoBtn}
                        onClick={() => alternarHistorico(pedido.codigo_pedido_omie)}
                      >
                        <FaHistory />
                        {historicoAberto === pedido.codigo_pedido_omie ? 'Ocultar histórico' : 'Ver histórico'}
                      </button>
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
        )}
      </PageContent>
    </div>
  );
}
