'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { getCategorias } from '@/services/orcamento/categoriasOrcamento';
import { getVinculos } from '@/services/orcamento/vinculosOrcamento';
import { VinculoProps } from '../vinculos/types';
import normalizeText from '@/utils/normalizeText';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';

export default function SemCadastro() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<VinculoProps[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const busca = useDebounce(buscaInput, 300);

  useEffect(() => {
    error && notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [vinculosData, categoriasData] = await Promise.all([getVinculos(), getCategorias()]);
        setRows(vinculosData.vinculos.filter((v) => v.sem_cadastro));
        setCategorias(categoriasData.categorias);
      } catch (erro) {
        console.error(erro);
        setError('Erro ao carregar fornecedores sem cadastro');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  const filteredRows = useMemo(() => {
    const termo = normalizeText(busca);
    return rows.filter((row) => {
      const matchCategoria = !categoriaSelecionada || row.categoria === categoriaSelecionada;
      const matchBusca = !termo || normalizeText(row.fornecedor).includes(termo);
      return matchCategoria && matchBusca;
    });
  }, [rows, categoriaSelecionada, busca]);

  useEffect(() => {
    setPage(0);
  }, [categoriaSelecionada, busca]);

  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage]
  );

  return (
    <>
      <PageHeader
        title="Sem Cadastro"
        subtitle="Fornecedores vinculados a uma categoria sem correspondência no cadastro"
      />
      <PageContent>
        <div className={styles.banner}>
          <div className={styles.bannerTitle}>Fornecedores sem correspondência no cadastro</div>
          <div className={styles.bannerText}>
            Existem nos vínculos, mas não foram localizados na base de fornecedores.
          </div>
        </div>
        <Card height="fit" title="Filtrar">
          <div className={styles.inputContainers}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 240 }}
              options={categorias}
              value={categoriaSelecionada || null}
              onChange={(_, v) => setCategoriaSelecionada(v ?? '')}
              renderInput={(params) => (
                <TextField {...params} label="Categoria" placeholder="Todas as categorias" />
              )}
            />
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label="Buscar fornecedor"
              variant="outlined"
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
            />
          </div>
        </Card>
        <Card title="Fornecedores sem cadastro">
          <div className={styles.tableCard}>
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
                    {['Categoria', 'Fornecedor (Vínculo)'].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.length ? (
                    pagedRows.map((row, key) => (
                      <TableRow key={key} hover>
                        <TableCell>{row.categoria}</TableCell>
                        <TableCell>{row.fornecedor}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        Nenhum fornecedor pendente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </div>
            <MobileCardList
              rows={pagedRows}
              getRowKey={(row) => `${row.categoria}-${row.fornecedor}`}
              emptyMessage="Nenhum fornecedor pendente."
              renderTitle={(row) => row.fornecedor}
              fields={(row) => [{ label: 'Categoria', value: row.categoria }]}
            />
            </>
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={setPage}
            onRowsPerPageChange={(rpp) => {
              setRowsPerPage(rpp);
              setPage(0);
            }}
          />
          </div>
        </Card>
      </PageContent>
    </>
  );
}
