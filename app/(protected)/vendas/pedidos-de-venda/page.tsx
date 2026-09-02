'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Chip, CircularProgress } from '@mui/material';
import styles from './styles.module.css';
import Modal from '@/components/Ui/Modal/Modal';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { getPedidosVenda } from '@/services/vendas/pedidosVenda';
import { getVendedores } from '@/services/vendas/vendedores';
import { getUnidades, UnidadeProps } from '@/services/rh/referenciais';
import { VendedorProps } from '@/services/vendas/vendedores';
import { PedidoVendaProps } from './types';
import { usePermission } from '@/hooks/usePermission';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';

const situacaoColor: Record<
  string,
  'var(--green)' | 'var(--red)' | 'var(--orange)' | 'var(--blue)' | 'var(--gray)'
> = {
  faturado: 'var(--green)',
  cancelado: 'var(--red)',
  encerrado: 'var(--blue)',
  devolvido: 'var(--orange)',
  pendente: 'var(--gray)',
};

export default function PedidosVenda() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<PedidoVendaProps | null>(null);

  const { can } = usePermission();

  const [rows, setRows] = useState<PedidoVendaProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [vendedores, setVendedores] = useState<VendedorProps[]>([]);
  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [vendedorFiltro, setVendedorFiltro] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('');

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadReferenciais() {
      try {
        const [vendedoresData, unidadesData] = await Promise.all([getVendedores(), getUnidades()]);
        setVendedores(vendedoresData.data);
        setUnidades(unidadesData.unidades);
      } catch {
        notify.error('Erro ao carregar vendedores e unidades');
      }
    }
    loadReferenciais();
  }, []);

  useEffect(() => {
    async function fetchPedidos() {
      try {
        setLoading(true);
        // Número do pedido é só dígitos — o mesmo campo de busca decide entre
        // número e cliente pelo formato do termo digitado.
        const isNumeroQuery = /^\d+$/.test(search);
        const response = await getPedidosVenda({
          page: page + 1,
          limit: rowsPerPage,
          numero_pedido: isNumeroQuery && search ? search : undefined,
          codigo_cliente: !isNumeroQuery && search ? search : undefined,
          codigo_vendedor: vendedorFiltro || undefined,
          codigo_empresa: empresaFiltro || undefined,
        });
        setRows(response.pedidos_vendas ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar pedidos de venda');
      } finally {
        setLoading(false);
      }
    }
    fetchPedidos();
  }, [page, rowsPerPage, search, vendedorFiltro, empresaFiltro]);

  const vendedorLabel = (codigo: string) => {
    const found = vendedores.find((v) => v.codigo_vendedor_omie === codigo);
    return found ? found.nome : codigo;
  };

  const unidadeLabel = (id: string) => {
    const found = unidades.find((u) => u.id === id);
    return found ? found.nome_fantasia : id;
  };

  const abrirDetalhes = (pedido: PedidoVendaProps) => {
    setSelected(pedido);
    setIsModalOpen(true);
  };

  const FILTROS_PEDIDO = [
    {
      key: 'vendedor',
      label: 'Vendedor',
      options: vendedores.map((v) => ({ value: v.codigo_vendedor_omie, label: v.nome })),
    },
    {
      key: 'unidade',
      label: 'Unidade',
      options: unidades.map((u) => ({ value: u.id, label: u.nome_fantasia })),
    },
  ];

  return (
    <>
      <div className={styles.pageGlow}>
        <div className={styles.pageHeaderRow}>
          <PageHeader
            title="Pedidos de Venda"
            subtitle="Consulte os pedidos de venda sincronizados"
          />
        </div>
        <PageContent>
          <div className={styles.tableCard}>
            <SearchFilterBar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                setPage(0);
              }}
              searchPlaceholder="Buscar por número do pedido ou cliente..."
              filters={FILTROS_PEDIDO}
              activeValues={{
                vendedor: vendedorFiltro || undefined,
                unidade: empresaFiltro || undefined,
              }}
              onFilterChange={(key, value) => {
                if (key === 'vendedor') {
                  setVendedorFiltro(value ?? '');
                  setPage(0);
                } else if (key === 'unidade') {
                  setEmpresaFiltro(value ?? '');
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
            ) : (
              <>
                <div className={styles.tableWrapper}>
                  <TableContainer
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflow: 'auto',
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {[
                            'Nº Pedido',
                            'Sequencial',
                            'Data Inclusão',
                            'Etapa',
                            'Cliente',
                            'Vendedor',
                            'Valor Total',
                            'Situação',
                          ].map((label) => (
                            <TableCell
                              key={label}
                              sx={{
                                background:
                                  'linear-gradient(180deg, color-mix(in srgb, var(--foreground) 6%, transparent), color-mix(in srgb, var(--foreground) 1.5%, transparent))',
                                borderBottom:
                                  '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)',
                              }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow
                            hover={can('pode_visualizar')}
                            key={row.codigo_pedido_omie}
                            onClick={can('pode_visualizar') ? () => abrirDetalhes(row) : undefined}
                            sx={{
                              cursor: can('pode_visualizar') ? 'pointer' : 'default',
                              '& .MuiTableCell-root': {
                                borderBottom:
                                  '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                              },
                            }}
                          >
                            <TableCell>{row.numero_pedido ?? '—'}</TableCell>
                            <TableCell>{row.sequencial ?? 0}</TableCell>
                            <TableCell>
                              {row.data_inclusao ? dateFormatter(row.data_inclusao) : '—'}
                            </TableCell>
                            <TableCell>{row.etapa ?? '—'}</TableCell>
                            <TableCell>{row.codigo_cliente ?? '—'}</TableCell>
                            <TableCell>{vendedorLabel(row.codigo_vendedor_omie)}</TableCell>
                            <TableCell>{toBRL(row.valor_total_pedido)}</TableCell>
                            <TableCell>
                              <Chip
                                sx={{
                                  backgroundColor: row.situacao
                                    ? (situacaoColor[row.situacao.toLowerCase()] ?? 'default')
                                    : 'default',
                                  color: 'var(--white)',
                                }}
                                label={row.situacao ?? '—'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
                <MobileCardList
                  rows={rows}
                  getRowKey={(row) => String(row.codigo_pedido_omie)}
                  emptyMessage="Nenhum pedido encontrado."
                  onRowClick={can('pode_visualizar') ? abrirDetalhes : undefined}
                  renderMeta={(row) => (row.data_inclusao ? dateFormatter(row.data_inclusao) : '—')}
                  renderTitle={(row) => row.numero_pedido ?? '—'}
                  renderSubtitle={(row) => row.codigo_cliente ?? '—'}
                  renderBadge={(row) => (
                    <Chip
                      sx={{
                        backgroundColor: row.situacao
                          ? (situacaoColor[row.situacao.toLowerCase()] ?? 'default')
                          : 'default',
                        color: 'var(--white)',
                      }}
                      label={row.situacao ?? '—'}
                      size="small"
                    />
                  )}
                  fields={(row) => [
                    { label: 'Etapa', value: row.etapa ?? '—' },
                    { label: 'Vendedor', value: vendedorLabel(row.codigo_vendedor_omie) },
                  ]}
                  renderHighlight={(row) => ({
                    label: 'Valor Total',
                    value: toBRL(row.valor_total_pedido),
                  })}
                />
              </>
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

      <Modal
        title="Detalhes do Pedido"
        subtitle={selected?.numero_pedido ?? undefined}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        {selected && (
          <div className={styles.detailModal}>
            <p className={styles.sectionTitle}>Identificação</p>
            <hr className={styles.divider} />
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Número do Pedido</span>
                <span className={styles.detailValue}>{selected.numero_pedido ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Sequencial</span>
                <span className={styles.detailValue}>{selected.sequencial ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Cliente</span>
                <span className={styles.detailValue}>{selected.codigo_cliente ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Vendedor</span>
                <span className={styles.detailValue}>
                  {vendedorLabel(selected.codigo_vendedor_omie)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Unidade</span>
                <span className={styles.detailValue}>{unidadeLabel(selected.codigo_empresa)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Situação</span>
                <span className={styles.detailValue}>{selected.situacao ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Categoria</span>
                <span className={styles.detailValue}>{selected.codigo_categoria ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Projeto</span>
                <span className={styles.detailValue}>{selected.codigo_projeto ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Contrato</span>
                <span className={styles.detailValue}>{selected.numero_contrato ?? '—'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Valor Total</span>
                <span className={styles.detailValue}>{toBRL(selected.valor_total_pedido)}</span>
              </div>
            </div>

            <p className={styles.sectionTitle}>Datas</p>
            <hr className={styles.divider} />
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Inclusão</span>
                <span className={styles.detailValue}>
                  {selected.data_inclusao ? dateFormatter(selected.data_inclusao) : '—'}{' '}
                  {selected.hora_inclusao ?? ''}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Previsão</span>
                <span className={styles.detailValue}>
                  {selected.data_previsao ? dateFormatter(selected.data_previsao) : '—'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Faturamento</span>
                <span className={styles.detailValue}>
                  {selected.data_faturamento ? dateFormatter(selected.data_faturamento) : '—'}{' '}
                  {selected.hora_faturamento ?? ''}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Cancelamento</span>
                <span className={styles.detailValue}>
                  {selected.data_cancelamento ? dateFormatter(selected.data_cancelamento) : '—'}{' '}
                  {selected.hora_cancelamento ?? ''}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Encerramento</span>
                <span className={styles.detailValue}>
                  {selected.data_encerramento ? dateFormatter(selected.data_encerramento) : '—'}{' '}
                  {selected.hora_encerramento ?? ''}
                </span>
              </div>
            </div>

            {selected.encerrado && (
              <>
                <p className={styles.sectionTitle}>Encerramento</p>
                <hr className={styles.divider} />
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Motivo</span>
                    <span className={styles.detailValue}>
                      {selected.motivo_encerramento ?? '—'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Usuário</span>
                    <span className={styles.detailValue}>
                      {selected.usuario_encerramento ?? '—'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {selected.obs_venda && (
              <>
                <p className={styles.sectionTitle}>Observações</p>
                <hr className={styles.divider} />
                <div className={styles.detailItem}>
                  <span className={styles.detailValue}>{selected.obs_venda}</span>
                </div>
              </>
            )}

            <p className={styles.sectionTitle}>Status</p>
            <hr className={styles.divider} />
            <div className={styles.chipsRow}>
              <Chip
                label="Autorizado"
                size="small"
                color={selected.autorizado ? 'success' : 'default'}
              />
              <Chip label="Denegado" size="small" color={selected.denegado ? 'error' : 'default'} />
              <Chip
                label="Faturado"
                size="small"
                color={selected.faturado ? 'success' : 'default'}
              />
              <Chip
                label="Cancelado"
                size="small"
                color={selected.cancelado ? 'error' : 'default'}
              />
              <Chip
                label="Devolvido"
                size="small"
                color={selected.devolvido ? 'warning' : 'default'}
              />
              <Chip
                label="Devolução Parcial"
                size="small"
                color={selected.devolucao_parcial ? 'warning' : 'default'}
              />
              <Chip
                label="Encerrado"
                size="small"
                color={selected.encerrado ? 'warning' : 'default'}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
