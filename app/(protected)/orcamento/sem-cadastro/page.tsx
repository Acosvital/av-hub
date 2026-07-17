'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { getCategorias } from '@/services/categoriasOrcamento';
import { getVinculos } from '@/services/vinculosOrcamento';
import { VinculoProps } from '../vinculos/types';
import normalizeText from '@/utils/normalizeText';

export default function SemCadastro() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<VinculoProps[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
            <FormControl sx={{ flex: 1, minWidth: 240 }}>
              <InputLabel id="categoria-filtro">Categoria</InputLabel>
              <Select
                labelId="categoria-filtro"
                label="Categoria"
                value={categoriaSelecionada}
                onChange={(e) => setCategoriaSelecionada(e.target.value)}
              >
                <MenuItem value="">Todas as categorias</MenuItem>
                {categorias.map((categoria) => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ maxHeight: 380, overflowX: 'auto' }}>
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
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            labelRowsPerPage={'Resultados por página'}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Card>
      </PageContent>
    </>
  );
}
