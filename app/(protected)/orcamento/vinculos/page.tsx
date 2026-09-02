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
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';

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
            <Autocomplete
              sx={{ flex: 1, minWidth: 240 }}
              options={categorias}
              value={categoriaSelecionada || null}
              onChange={(_, v) => setCategoriaSelecionada(v ?? '')}
              renderInput={(params) => (
                <TextField {...params} label="Categoria" placeholder="Todas as categorias" />
              )}
            />
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
            </div>
            <MobileCardList
              rows={pagedRows}
              getRowKey={(row) => `${row.categoria}-${row.cnpj}-${row.fornecedor}`}
              emptyMessage="Nenhum vínculo encontrado."
              renderTitle={(row) => row.fornecedor}
              renderSubtitle={(row) => row.razao_social}
              renderBadge={(row) =>
                row.sem_cadastro ? (
                  <span className={styles.badgeWarning}>Sem cadastro</span>
                ) : (
                  <span className={styles.badgeOk}>Com cadastro</span>
                )
              }
              fields={(row) => [
                { label: 'Categoria', value: row.categoria },
                { label: 'CNPJ', value: row.cnpj },
                { label: 'Situação', value: row.situacao || '—' },
                { label: 'Cidade', value: row.cidade },
              ]}
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
      <Modal title="Novo Vínculo" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className={styles.modalContent}>
          <Autocomplete
            fullWidth
            options={categorias}
            value={novaCategoria || null}
            onChange={(_, v) => setNovaCategoria(v ?? '')}
            renderInput={(params) => <TextField {...params} label="Categoria" />}
          />
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
