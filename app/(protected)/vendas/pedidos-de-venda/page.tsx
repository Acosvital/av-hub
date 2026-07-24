'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import {
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { getPedidosVenda } from '@/services/pedidosVenda';
import { getVendedores } from '@/services/vendedores';
import { getUnidades, UnidadeProps } from '@/services/referenciais';
import { VendedorProps } from '@/services/vendedores';
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

  const [numeroInput, setNumeroInput] = useState('');
  const [clienteInput, setClienteInput] = useState('');
  const numero = useDebounce(numeroInput, 500);
  const cliente = useDebounce(clienteInput, 500);
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
        const response = await getPedidosVenda({
          page: page + 1,
          limit: rowsPerPage,
          numero_pedido: numero || undefined,
          codigo_cliente: cliente || undefined,
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
  }, [page, rowsPerPage, numero, cliente, vendedorFiltro, empresaFiltro]);

  const vendedorLabel = (codigo: string) => {
    const found = vendedores.find((v) => v.codigo_vendedor_omie === codigo);
    return found ? found.nome : codigo;
  };

  const unidadeLabel = (id: string) => {
    const found = unidades.find((u) => u.id === id);
    return found ? found.nome : id;
  };

  const limparFiltros = () => {
    setNumeroInput('');
    setClienteInput('');
    setVendedorFiltro('');
    setEmpresaFiltro('');
    setPage(0);
  };

  const abrirDetalhes = (pedido: PedidoVendaProps) => {
    setSelected(pedido);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageHeader title="Pedidos de Venda" subtitle="Consulte os pedidos de venda sincronizados" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Número do Pedido"
              variant="outlined"
              value={numeroInput}
              onChange={(e) => setNumeroInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Cliente"
              variant="outlined"
              value={clienteInput}
              onChange={(e) => setClienteInput(e.target.value)}
            />
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Vendedor</InputLabel>
              <Select
                value={vendedorFiltro}
                label="Vendedor"
                onChange={(e) => {
                  setVendedorFiltro(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {vendedores.map((v) => (
                  <MenuItem key={v.codigo_vendedor_omie} value={v.codigo_vendedor_omie}>
                    {v.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Unidade</InputLabel>
              <Select
                value={empresaFiltro}
                label="Unidade"
                onChange={(e) => {
                  setEmpresaFiltro(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {unidades.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={styles.cardButtons}>
            <Button variant="secondary" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card title="Pedidos de Venda">
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
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
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      hover={can('pode_visualizar')}
                      key={row.codigo_pedido_omie}
                      onClick={can('pode_visualizar') ? () => abrirDetalhes(row) : undefined}
                      sx={{ cursor: can('pode_visualizar') ? 'pointer' : 'default' }}
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
          )}
          <TablePagination
            sx={{ flexShrink: 0 }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={rowCount}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage="Resultados por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Card>
      </PageContent>

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
