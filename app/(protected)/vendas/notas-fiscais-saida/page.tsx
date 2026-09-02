'use client';
import styles from './styles.module.css';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import { getNotasFiscaisSaida } from '@/services/vendas/notasFiscaisSaida';
import { useEffect, useState } from 'react';
import { NotasFiscaisSaidaProps } from './types';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import {
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';

const NotasFiscaisSaida = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rows, setRows] = useState<NotasFiscaisSaidaProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getNotasFiscaisSaida({
          page: page + 1,
          limit: rowsPerPage,
          numero_nf: search || undefined,
        });
        setRows(response.nota_fiscal_saida ?? []);
        setRowCount(response.total ?? 0);
      } catch (error) {
        console.error(error);
        setError('Erro ao carregar as notas fiscais de saída.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, rowsPerPage, search]);

  return (
    <>
      <div className={styles.pageGlow}>
        <div className={styles.pageHeaderRow}>
          <PageHeader title="Notas Fiscais de Saída" subtitle="Consulte as Notas Fiscais" />
        </div>
        <PageContent>
          <div className={styles.tableCard}>
            <SearchFilterBar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                setPage(0);
              }}
              searchPlaceholder="Buscar por número da NF..."
              filters={[]}
              activeValues={{}}
              onFilterChange={() => {}}
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
                            'Data',
                            'Numero NF',
                            'Cliente',
                            'Vendedor',
                            'Filial',
                            'Cod. Categoria',
                            'Valor IPI',
                            'Valor Mercadorias',
                            'Valor Total',
                            'Averbada?',
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
                            key={row.codigo_nf_omie}
                            sx={{
                              '& .MuiTableCell-root': {
                                borderBottom:
                                  '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                              },
                            }}
                          >
                            <TableCell>{dateFormatter(row.data_emissao)}</TableCell>
                            <TableCell>{row.numero_nf}</TableCell>
                            <TableCell>{row.codigo_cliente}</TableCell>
                            <TableCell>{row.codigo_vendedor_omie ?? '-'}</TableCell>
                            <TableCell>{row.codigo_empresa}</TableCell>
                            <TableCell>{row.codigo_categoria}</TableCell>
                            <TableCell>{toBRL(row.valor_ipi)}</TableCell>
                            <TableCell>{toBRL(row.valor_mercadorias)}</TableCell>
                            <TableCell>{toBRL(row.valor_nf)}</TableCell>
                            <TableCell>
                              <Chip
                                label={row.averbado ? 'Sim' : 'Não'}
                                color={row.averbado ? 'success' : 'error'}
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
                  getRowKey={(row) => String(row.codigo_nf_omie)}
                  emptyMessage="Nenhuma nota fiscal encontrada."
                  renderMeta={(row) => dateFormatter(row.data_emissao)}
                  renderTitle={(row) => `NF ${row.numero_nf}`}
                  renderSubtitle={(row) => row.codigo_cliente}
                  renderBadge={(row) => (
                    <Chip
                      label={row.averbado ? 'Averbada' : 'Não averbada'}
                      color={row.averbado ? 'success' : 'error'}
                      size="small"
                    />
                  )}
                  fields={(row) => [
                    { label: 'Vendedor', value: row.codigo_vendedor_omie ?? '-' },
                    { label: 'Filial', value: row.codigo_empresa },
                    { label: 'Cod. Categoria', value: row.codigo_categoria },
                    { label: 'Valor IPI', value: toBRL(row.valor_ipi) },
                    { label: 'Valor Mercadorias', value: toBRL(row.valor_mercadorias) },
                  ]}
                  renderHighlight={(row) => ({ label: 'Valor Total', value: toBRL(row.valor_nf) })}
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
    </>
  );
};

export default NotasFiscaisSaida;
