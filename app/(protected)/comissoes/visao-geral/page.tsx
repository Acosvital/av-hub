'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { CircularProgress, TextField } from '@mui/material';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import MesSeletor from '@/components/Ui/MesSeletor/MesSeletor';
import useDashboardDate from '@/hooks/useDashboardDate';
import { useDebounce } from '@/hooks/useDebouncer';
import { notify } from '@/lib/toast/toast';
import { getVisaoGeralComissoes } from '@/services/comissoes/visaoGeral';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import { VisaoGeralComissaoRow } from './types';
import styles from './styles.module.css';

const COLUNAS = [
  'Data Emissão',
  'Número Pedido',
  'Nota Fiscal',
  'Cliente',
  'Vendedor',
  'Valor Faturado',
  'Margem',
  'Comissão Simulador',
  'Comissão Estimada',
  'Comissão Compras',
  'Comissão Real',
  'Valor Comissão Calculado',
  'Obs. Comissão',
];

const getRowKey = (row: VisaoGeralComissaoRow) =>
  row.codigo_nf_omie != null
    ? String(row.codigo_nf_omie)
    : `${row.nota_fiscal ?? 's/nf'}-${row.numero_pedido ?? 's/pedido'}`;

// Tela somente leitura ("Comissões > Visão Geral") — lista NFs faturadas
// (grão = NF) pra acompanhamento de comissão de vendas. Sem criar/editar/
// excluir: os dados vêm do BFF em app/api/comissoes/visao-geral/route.ts, que
// já junta faturamento + sequencial do pedido. As colunas de comissão em si
// (margem, %s, valor calculado, obs.) ainda não têm fonte de dado — chegam
// null e aparecem como "—" até existir uma rota real pra elas.
export default function VisaoGeralComissoes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rows, setRows] = useState<VisaoGeralComissaoRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Período = mês inteiro escolhido no MesSeletor (mesmo componente/contexto
  // global — useDashboardDate — usado em Meus Pedidos/Minhas Notas/Meu
  // Dashboard), não mais um range livre de datas. Default = mês corrente,
  // já que o Provider inicializa completeDate com dayjs() na raiz do app.
  const { completeDate } = useDashboardDate();
  const mes = completeDate.month() + 1;
  const ano = completeDate.year();

  // Filtros de texto (Número do Pedido / Cliente / Vendedor) — debounced pra
  // não disparar 1 requisição por tecla (useDebounce já usado em outras
  // telas do projeto, ver hooks/useDebouncer.ts).
  const [pedidoInput, setPedidoInput] = useState('');
  const [clienteInput, setClienteInput] = useState('');
  const [vendedorInput, setVendedorInput] = useState('');
  const pedido = useDebounce(pedidoInput, 500);
  const cliente = useDebounce(clienteInput, 500);
  const vendedor = useDebounce(vendedorInput, 500);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  // Volta pra página 1 sempre que mês ou algum filtro de texto muda — a
  // busca em si (efeito abaixo) reage a `page`, então só resetar já dispara
  // a requisição certa.
  useEffect(() => {
    setPage(0);
  }, [mes, ano, pedido, cliente, vendedor]);

  useEffect(() => {
    async function fetchDados() {
      try {
        setLoading(true);
        const response = await getVisaoGeralComissoes({
          page: page + 1,
          limit: rowsPerPage,
          mes,
          ano,
          pedido: pedido || undefined,
          cliente: cliente || undefined,
          vendedor: vendedor || undefined,
        });
        setRows(response.data ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar visão geral de comissões');
      } finally {
        setLoading(false);
      }
    }
    fetchDados();
  }, [page, rowsPerPage, mes, ano, pedido, cliente, vendedor]);

  return (
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader
          title="Visão Geral"
          subtitle="Notas fiscais faturadas para acompanhamento de comissão de vendas"
        />
        <MesSeletor />
      </div>
      <PageContent>
        <div className={styles.tableCard}>
          <div className={styles.filtersRow}>
            <TextField
              className={styles.filterField}
              label="Número do Pedido"
              size="small"
              value={pedidoInput}
              onChange={(e) => setPedidoInput(e.target.value)}
            />
            <TextField
              className={styles.filterField}
              label="Cliente"
              size="small"
              value={clienteInput}
              onChange={(e) => setClienteInput(e.target.value)}
            />
            <TextField
              className={styles.filterField}
              label="Vendedor"
              size="small"
              value={vendedorInput}
              onChange={(e) => setVendedorInput(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <>
              <div className={styles.tableWrapper}>
                <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {COLUNAS.map((label) => (
                          <TableCell
                            key={label}
                            sx={{
                              background:
                                'linear-gradient(180deg, color-mix(in srgb, var(--foreground) 6%, transparent), color-mix(in srgb, var(--foreground) 1.5%, transparent))',
                              borderBottom:
                                '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)',
                              whiteSpace: 'nowrap',
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
                          key={getRowKey(row)}
                          sx={{
                            '& .MuiTableCell-root': {
                              borderBottom:
                                '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                            },
                          }}
                        >
                          <TableCell>
                            {row.data_emissao ? dateFormatter(row.data_emissao) : '—'}
                          </TableCell>
                          <TableCell>{row.numero_pedido || '—'}</TableCell>
                          <TableCell>{row.nota_fiscal || '—'}</TableCell>
                          <TableCell>{row.cliente || '—'}</TableCell>
                          <TableCell>{row.vendedor || '—'}</TableCell>
                          <TableCell>
                            {row.valor_faturado != null ? toBRL(row.valor_faturado) : '—'}
                          </TableCell>
                          <TableCell>{row.margem_simulador ?? '—'}</TableCell>
                          <TableCell>{row.comissao_vendedor_pct ?? '—'}</TableCell>
                          <TableCell>{row.comissao_estimada ?? '—'}</TableCell>
                          <TableCell>{row.comissao_compras_pct ?? '—'}</TableCell>
                          <TableCell>{row.comissao_real_pct ?? '—'}</TableCell>
                          <TableCell>{row.valor_comissao_calculado ?? '—'}</TableCell>
                          <TableCell>{row.obs_comissao || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={COLUNAS.length} style={{ textAlign: 'center' }}>
                            Nenhuma nota fiscal encontrada para o período selecionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
              <MobileCardList
                rows={rows}
                getRowKey={getRowKey}
                emptyMessage="Nenhuma nota fiscal encontrada para o período selecionado."
                renderMeta={(row) => (row.data_emissao ? dateFormatter(row.data_emissao) : '—')}
                renderTitle={(row) => row.cliente || '—'}
                renderSubtitle={(row) =>
                  `NF ${row.nota_fiscal || '—'} · Pedido ${row.numero_pedido || '—'}`
                }
                renderHighlight={(row) => ({
                  label: 'Valor Faturado',
                  value: row.valor_faturado != null ? toBRL(row.valor_faturado) : '—',
                })}
                fields={(row) => [
                  { label: 'Vendedor', value: row.vendedor || '—' },
                  { label: 'Margem', value: row.margem_simulador ?? '—' },
                  { label: 'Comissão Estimada', value: row.comissao_estimada ?? '—' },
                  { label: 'Comissão Real', value: row.comissao_real_pct ?? '—' },
                  { label: 'Obs. Comissão', value: row.obs_comissao || '—' },
                ]}
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
  );
}
