'use client';

import { useMemo, useState, useEffect } from 'react';
import styles from "./styles.module.css";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import * as XLSX from "xlsx";
import Card from "@/components/Ui/Card/Card";
import { CircularProgress, TextField } from '@mui/material';
import Modal from '@/components/Ui/Modal/Modal';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { ParceirosProps } from './types';
import { getTodosFornecedores } from '@/services/todosFornecedores';

export default function CatalogoDeProdutos() {
  //States utilitarios
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  //States para os dados: Pagina/Modal
  const [rows, setRows] = useState<ParceirosProps[]>([]);
  //States de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowCount, setRowCont] = useState(0);
  //Input Descrição
  const [descricaoInput, setDescricaoInput] = useState('');
  const descricao = useDebounce(descricaoInput, 500);

  //Notifica erros
  useEffect(() => {
    error && notify.error(error)
  }, [error]);

  //Carregamento dos filtros e dados iniciais
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [
          fornecedorData,
        ] = await Promise.all([
          getTodosFornecedores(),
        ]);
        setRows(fornecedorData.fornecedores);
      } catch (erro) {
        setError('Erro ao carregar fornecedores');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  //Filtragem de resultados através de descrição E/OU familia de produtos E/OU fornecedor
  const filteredRows = useMemo(() => {
    const term = descricao.toLowerCase();
    return rows.filter((row) => {
      return row
    });
  }, [descricao, rows]);

  //Funções utilitarias para os botões da página
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, "fornecedores.xlsx");
  };

  return (
    <>
      <PageHeader
        title='Fornecedores'
        subtitle='Consulte os últimos valores praticados pelos produtos'
      />
      <PageContent>
        <Card
          height='fit'
          title='Consulta de Fornecedores'
        >
          <div>
            <TextField sx={{ flex: 1, minWidth: 300 }}
              id="outlined-basic"
              label="Nome do Fornecedor"
              variant="outlined"
            />
            <TextField sx={{ flex: 1, minWidth: 300 }}
              id="outlined-basic"
              label="Estado"
              variant="outlined"
            />
          </div>
        </Card>
        <Card
          title='Fornecedores encontrados'
          download={exportToExcel}
          create={exportToExcel}
        >
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ maxHeight: 380, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead >
                  <TableRow >
                    {["Razão Social", "Nome Fantasia", "CPF/CNPJ", "Cidade", "UF", "Telefone", "E-mail"].map((label) => (
                      <TableCell key={label} >{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row, key) => (
                    <TableRow key={key} hover onClick={() => {
                      setIsOpen(true)
                    }}>
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
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={rowCount}
            rowsPerPage={rowsPerPage}
            labelRowsPerPage={'Resultados por página'}
            labelDisplayedRows={({ from, to, count }) => { return `${from}-${to} de ${count}` }}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Card>
      </PageContent>
      <Modal
        title='Fornecedor'
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div>

        </div>
      </Modal>
    </>
  );
}