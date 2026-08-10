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
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { getCategorias } from '@/services/orcamento/categoriasOrcamento';
import { getVinculos } from '@/services/orcamento/vinculosOrcamento';
import { VinculoProps } from './types';
import normalizeText from '@/utils/normalizeText';

type StatusFiltro = '' | 'ok' | 'nf';

export default function Vinculos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<VinculoProps[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [statusSelecionado, setStatusSelecionado] = useState<StatusFiltro>('');
  const [buscaInput, setBuscaInput] = useState('');
  const busca = useDebounce(buscaInput, 300);

  //Campos do modal "Novo Vínculo" (apenas consulta — ver handleSalvar)
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoFornecedor, setNovoFornecedor] = useState('');

  useEffect(() => {
    error && notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [vinculosData, categoriasData] = await Promise.all([getVinculos(), getCategorias()]);
        setRows(vinculosData.vinculos);
        setCategorias(categoriasData.categorias);
      } catch (erro) {
        console.error(erro);
        setError('Erro ao carregar vínculos');
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
      const matchStatus =
        !statusSelecionado ||
        (statusSelecionado === 'ok' && !row.sem_cadastro) ||
        (statusSelecionado === 'nf' && row.sem_cadastro);
      const matchBusca =
        !termo ||
        normalizeText(row.fornecedor).includes(termo) ||
        normalizeText(row.razao_social).includes(termo);
      return matchCategoria && matchStatus && matchBusca;
    });
  }, [rows, categoriaSelecionada, statusSelecionado, busca]);

  useEffect(() => {
    setPage(0);
  }, [categoriaSelecionada, statusSelecionado, busca]);

  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage]
  );

  const abrirModalNovoVinculo = () => {
    setNovaCategoria('');
    setNovoFornecedor('');
    setIsOpen(true);
  };

  const handleSalvar = () => {
    notify.info('Consulta apenas — integração com o setor de compras ainda não disponível.');
    setIsOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Vínculos"
        subtitle="Consulte os vínculos entre categorias e fornecedores"
      />
      <PageContent>
        <Card height="fit" title="Filtrar vínculos">
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
            <FormControl sx={{ flex: 1, minWidth: 200 }}>
              <InputLabel id="status-filtro">Status</InputLabel>
              <Select
                labelId="status-filtro"
                label="Status"
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value as StatusFiltro)}
              >
                <MenuItem value="">Todos os status</MenuItem>
                <MenuItem value="ok">Com cadastro</MenuItem>
                <MenuItem value="nf">Sem cadastro</MenuItem>
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
        <Card title="Vínculos encontrados" create={abrirModalNovoVinculo}>
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
                      'Categoria',
                      'Fornecedor',
                      'Razão Social',
                      'CNPJ',
                      'Situação',
                      'Cidade',
                      'Status',
                    ].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.map((row, key) => (
                    <TableRow key={key} hover>
                      <TableCell>{row.categoria}</TableCell>
                      <TableCell>{row.fornecedor}</TableCell>
                      <TableCell>{row.razao_social}</TableCell>
                      <TableCell>{row.cnpj}</TableCell>
                      <TableCell>{row.situacao || '—'}</TableCell>
                      <TableCell>{row.cidade}</TableCell>
                      <TableCell>
                        {row.sem_cadastro ? (
                          <span className={styles.badgeWarning}>Sem cadastro</span>
                        ) : (
                          <span className={styles.badgeOk}>Com cadastro</span>
                        )}
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
      <Modal title="Novo Vínculo" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className={styles.modalContent}>
          <FormControl fullWidth>
            <InputLabel id="nova-categoria">Categoria</InputLabel>
            <Select
              labelId="nova-categoria"
              label="Categoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
            >
              {categorias.map((categoria) => (
                <MenuItem key={categoria} value={categoria}>
                  {categoria}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Fornecedor"
            variant="outlined"
            value={novoFornecedor}
            onChange={(e) => setNovoFornecedor(e.target.value)}
          />
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSalvar}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
