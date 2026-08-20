'use client';
import styles from './styles.module.css';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import Card from '@/components/Ui/Card/Card';
import { getNotasFiscaisSaida } from '@/services/vendas/notasFiscaisSaida';
import { useEffect, useState } from 'react';
import { NotasFiscaisSaidaProps } from './types';
import { notify } from '@/lib/toast/toast';
import {
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';

const NotasFiscaisSaida = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rows, setRows] = useState<NotasFiscaisSaidaProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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
  }, [page, rowsPerPage]);

  return (
    <>
      <PageHeader title="Notas Fiscais de Saída" subtitle="Consulte as Notas Fiscais" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div>Inputs aqui</div>
        </Card>
        <Card title="Notas Fiscais de Saída">
          <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                borderBottom: 'none',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
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
                    <TableCell key={label}>{label}</TableCell>
                  ))}
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.codigo_nf_omie}>
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
          )}
          <TablePagination
            sx={{
              flexShrink: 0,
              border: '1px solid var(--border-strong)',
              borderTop: '1px solid var(--border)',
              borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
            }}
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
          </div>
        </Card>
      </PageContent>
    </>
  );
};

export default NotasFiscaisSaida;
