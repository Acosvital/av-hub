'use client';

import { useMemo, useState, useEffect } from 'react';
import styles from './styles.module.css';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import * as XLSX from 'xlsx';
import Card from '@/components/Ui/Card/Card';
import { CircularProgress, TextField } from '@mui/material';
import Modal from '@/components/Ui/Modal/Modal';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { ParceirosProps } from './types';
import { getTodosFornecedores } from '@/services/orcamento/todosFornecedores';
import { getVinculos } from '@/services/orcamento/vinculosOrcamento';
import { VinculoProps } from '../vinculos/types';
import normalizeText from '@/utils/normalizeText';

export default function CatalogoDeFornecedores() {
  //States utilitarios
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  //States para os dados: Pagina/Modal
  const [rows, setRows] = useState<ParceirosProps[]>([]);
  const [rowData, setRowData] = useState<ParceirosProps>();
  const [vinculos, setVinculos] = useState<VinculoProps[]>([]);
  //States de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  //Input Nome do Fornecedor
  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  //Input Estado
  const [estadoInput, setEstadoInput] = useState('');
  const estado = useDebounce(estadoInput, 500);

  //Notifica erros
  useEffect(() => {
    error && notify.error(error);
  }, [error]);

  //Carregamento dos dados iniciais (dados mockados — carregados uma única vez)
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [fornecedorData, vinculosData] = await Promise.all([
          getTodosFornecedores(),
          getVinculos(),
        ]);
        setRows(fornecedorData.fornecedores);
        setVinculos(vinculosData.vinculos);
      } catch (erro) {
        console.error(erro);
        setError('Erro ao carregar fornecedores');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  //Filtragem de resultados através de nome/razão social/CNPJ E/OU estado
  const filteredRows = useMemo(() => {
    const termoNome = normalizeText(nome);
    const termoEstado = normalizeText(estado);
    return rows.filter((row) => {
      const matchNome =
        !termoNome ||
        normalizeText(row.nome_fantasia).includes(termoNome) ||
        normalizeText(row.razao_social).includes(termoNome) ||
        row.cpf_cnpj.includes(nome);
      const matchEstado = !termoEstado || normalizeText(row.estado) === termoEstado;
      return matchNome && matchEstado;
    });
  }, [rows, nome, estado]);

  //Volta para a primeira página sempre que um filtro muda
  useEffect(() => {
    setPage(0);
  }, [nome, estado]);

  //Paginação client-side (dados mockados já vêm completos)
  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage]
  );

  //Categorias vinculadas ao fornecedor selecionado no modal
  const categoriasDoFornecedor = useMemo(() => {
    if (!rowData) return [];
    const nomeF = normalizeText(rowData.nome_fantasia);
    const razaoF = normalizeText(rowData.razao_social);
    const cnpjF = rowData.cpf_cnpj.replace(/\D/g, '');
    return vinculos
      .filter((v) => {
        const cnpjV = v.cnpj.replace(/\D/g, '');
        return (
          (cnpjF && cnpjV && cnpjF === cnpjV) ||
          normalizeText(v.nome_fantasia) === nomeF ||
          normalizeText(v.razao_social) === razaoF
        );
      })
      .map((v) => v.categoria);
  }, [rowData, vinculos]);

  //Funções utilitarias para os botões da página
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, 'fornecedores.xlsx');
  };

  return (
    <>
      <PageHeader title="Fornecedores" subtitle="Consulte os fornecedores cadastrados" />
      <PageContent>
        <Card height="fit" title="Consulta de Fornecedores">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label="Nome do Fornecedor"
              variant="outlined"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label="Estado"
              variant="outlined"
              value={estadoInput}
              onChange={(e) => setEstadoInput(e.target.value)}
            />
          </div>
        </Card>
        <Card title="Fornecedores encontrados" download={exportToExcel}>
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
                  <TableRow>
                    {[
                      'Razão Social',
                      'Nome Fantasia',
                      'CPF/CNPJ',
                      'Cidade',
                      'UF',
                      'Telefone',
                      'E-mail',
                    ].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.map((row, key) => (
                    <TableRow
                      key={key}
                      hover
                      onClick={() => {
                        setRowData(row);
                        setIsOpen(true);
                      }}
                    >
                      <TableCell>{row.razao_social}</TableCell>
                      <TableCell>{row.nome_fantasia}</TableCell>
                      <TableCell>{row.cpf_cnpj}</TableCell>
                      <TableCell>{row.cidade}</TableCell>
                      <TableCell>{row.estado}</TableCell>
                      <TableCell>{row.telefone}</TableCell>
                      <TableCell>{row.email}</TableCell>
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
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            labelRowsPerPage={'Resultados por página'}
            labelDisplayedRows={({ from, to, count }) => {
              return `${from}-${to} de ${count}`;
            }}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
          </div>
        </Card>
      </PageContent>
      <Modal
        title="Fornecedor"
        subtitle={rowData?.nome_fantasia}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {rowData && (
          <div className={styles.modalContent}>
            <div className={styles.definitionListContainer}>
              <dl className={styles.definitionList}>
                <dt className={styles.definitionTerm}>Razão Social:</dt>
                <dd className={styles.definitionDescription}>{rowData.razao_social}</dd>
                <dt className={styles.definitionTerm}>CPF/CNPJ:</dt>
                <dd className={styles.definitionDescription}>{rowData.cpf_cnpj}</dd>
                <dt className={styles.definitionTerm}>Cidade/UF:</dt>
                <dd className={styles.definitionDescription}>
                  {rowData.cidade} {rowData.estado ? `- ${rowData.estado}` : ''}
                </dd>
              </dl>
              <dl className={styles.definitionList}>
                <dt className={styles.definitionTerm}>Telefone:</dt>
                <dd className={styles.definitionDescription}>{rowData.telefone || '—'}</dd>
                <dt className={styles.definitionTerm}>E-mail:</dt>
                <dd className={styles.definitionDescription}>{rowData.email || '—'}</dd>
                <dt className={styles.definitionTerm}>Endereço:</dt>
                <dd className={styles.definitionDescription}>{rowData.logradouro || '—'}</dd>
              </dl>
            </div>
            {rowData.observacao && (
              <>
                <hr className={styles.divider} />
                <dl className={styles.definitionList}>
                  <dt className={styles.definitionTerm}>Observações:</dt>
                  <dd className={styles.definitionDescription}>{rowData.observacao}</dd>
                </dl>
              </>
            )}
            <hr className={styles.divider} />
            <div>
              <div className={styles.definitionTerm} style={{ marginBottom: 8 }}>
                Categorias vinculadas ({categoriasDoFornecedor.length})
              </div>
              <div className={styles.chips}>
                {categoriasDoFornecedor.length ? (
                  categoriasDoFornecedor.map((categoria) => (
                    <span key={categoria} className={styles.chip}>
                      {categoria}
                    </span>
                  ))
                ) : (
                  <span className={styles.definitionDescription}>Nenhuma categoria vinculada</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
