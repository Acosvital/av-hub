'use client';

import { useMemo, useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import * as XLSX from "xlsx";
import { FaFileDownload } from 'react-icons/fa';
import styles from "./styles.module.css";
import Card from "@/components/Card/Card";
import pedidos from "./pedidos_3.json";
import { Autocomplete, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import Modal from '@/components/Modal/Modal';
import { dataset, valueFormatter } from './product';
import Button from '@/components/Button/Button';
import AppLineChart from '@/components/Charts/AppLineChart';
import { notify } from '@/lib/toast/toast';
import { getProdutos } from '@/app/api/services/produtos';
import { getFamilias } from '@/app/api/services/familias';
import { getFornecedores } from '@/app/api/services/fornecedores';

type ProdutoProps = {
  "id_produto_omie": string,
  "codigo_produto": string,
  "descricao": string,
  "familia": string,
  "unidade_medida": string,
  "ativo": boolean,
  "id_parceiro_mais_recente": string,
  "nome_fantasia": string,
  "cotacao_mais_recente": string,
  "data_cotacao_mais_recente": string,
  "estado": string,
  "preco_medio_ultimas_cotacoes": string,
  "total_cotacoes": string
};

type FornecedorProps = {
  codigo_parceiro_omie: string;
  email: string;
  estado: string;
  nome_fantasia: string;
  telefone: string;
}

type FamiliaProdutosProps = {
  ativo: boolean;
  codigo_fprodutos: string;
  nome: string;
}

export default function Cadastro() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ProdutoProps[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rowData, setRowData] = useState<ProdutoProps>();

  const [fornecedorSelected, setFornecedorSelected] = useState<FornecedorProps | null>(null);
  const [inputFornecedor, setInputFornecedor] = useState<string>('');
  const [fornecedor, setFornecedor] = useState<FornecedorProps[]>([]);

  const [familiaProdutosSelected, setFamiliaProdutosSelected] = useState('');
  const [familiaProdutos, setFamiliaProdutos] = useState<FamiliaProdutosProps[]>([]);

  //Preparação do Array de produtos geral e familia de produtos
  // useEffect(() => {
  //   setLoading(true);
  //   let productfamilies: { familia: string }[] = [];
  //   let fornecedores: { fornecedor: string }[] = [];
  //   const parsed: ProdutoProps[] = pedidos.flatMap((pedido) =>
  //     pedido.produtos.map((produto) => {
  //       productfamilies.push({
  //         familia: produto.descricao_familia
  //       });
  //       fornecedores.push({
  //         fornecedor: pedido.fornecedor.nome_fantasia
  //       });
  //       return ({
  //         id: produto.cProduto,
  //         data: pedido.dIncData,
  //         fornecedor: pedido.fornecedor.nome_fantasia,
  //         descricao: produto.cDescricao,
  //         un: produto.cUnidade,
  //         valorMedio: 0,
  //         valorMercadoria: produto.nValUnit,
  //         estado: pedido.fornecedor.estado,
  //         familia: produto.descricao_familia
  //       })
  //     })
  //   );
  //   setRows(parsed);
  //   setLoading(false);
  // }, []);

  //Carregamento dos filtros e dados iniciais
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [
          familiaData,
          fornecedoresData,
          produtosData
        ] = await Promise.all([
          getFamilias(),
          getFornecedores(),
          getProdutos(),
        ]);
        console.log(produtosData)
        setFamiliaProdutos(familiaData.filter((el: FamiliaProdutosProps) => el.ativo === true));
        setFornecedor(fornecedoresData);
        setRows(produtosData.data)

      } catch (erro) {
        setError('Erro ao carregar catálogo de produtos');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  //Filtragem de resultados através de descrição E/OU familia de produtos E/OU fornecedor
  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter((row) => {
      const matchDescricao = row.descricao.toLowerCase().includes(term);
      const matchFamilia = !familiaProdutosSelected || row.familia === familiaProdutosSelected;
      const matchFornecedor = !fornecedorSelected || row.fornecedor === fornecedorSelected.nome_fantasia;
      return matchDescricao && matchFamilia && matchFornecedor;
    });
  }, [search, rows, familiaProdutosSelected, fornecedorSelected]);

  //Paginação
  const paginatedRows = useMemo(() => {
    return filteredRows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredRows, page, rowsPerPage]);

  //Export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, "catalogoDeProdutos.xlsx");
  };

  const limparCampos = () => {
    setSearch('');
    setFamiliaProdutosSelected('');
    setFornecedorSelected(null);
    setInputFornecedor('');
  }

  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      <div className={styles.title}>
        <h2 className={styles.title}>Catálogo de produtos</h2>
        <h3 className={styles.subtitle}>
          Consulte os últimos valores praticados pelos produtos
        </h3>
      </div>
      <div className={styles.content}>
        <Card>
          <h2 className={styles.cardTitle}>Consulta de Produtos</h2>

          <div className={styles.inputContainers}>
            <TextField sx={{ flex: 1, minWidth: 300 }}
              id="outlined-basic"
              label="Descrição"
              variant="outlined"
              value={search} onChange={(e) => {
                setSearch(e.target.value);
                setPage(0); // reset pagina
              }} />
            <FormControl sx={{ flex: 1, minWidth: 300 }}>
              <InputLabel id="familia-produto">Família de Produtos</InputLabel>
              <Select
                labelId="familia-produto"
                id="demo-simple-select"
                value={familiaProdutosSelected}
                label="FamiliaProdutos"
                onChange={(e) => setFamiliaProdutosSelected(e.target.value)}
              >

                <MenuItem value=""> </MenuItem>
                {familiaProdutos.map((familia, index) => (
                  <MenuItem key={index} value={familia.nome}>
                    {familia.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              sx={{ flex: 1, minWidth: 300 }}
              disablePortal
              options={fornecedor}
              getOptionKey={(fornecedor) => fornecedor.codigo_parceiro_omie}
              getOptionLabel={(fornecedor) => fornecedor.nome_fantasia}
              value={fornecedorSelected}
              inputValue={inputFornecedor}
              renderInput={(params) => <TextField {...params} label="Fornecedores" />}
              onChange={(_, newValue) => { setFornecedorSelected(newValue) }}
              onInputChange={(_, newInputValue) => { setInputFornecedor(newInputValue) }}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button variant='secondary' onClick={limparCampos}>
              Limpar Campos
            </Button>
          </div>
        </Card>

        <Card>
          <div className={styles.cardHeaderActions}>
            <h2 className={styles.cardTitle}>Produtos Encontrados</h2>
            <Button variant='primary' onClick={exportToExcel} icon={<FaFileDownload size={18} />}>
              Exportar
            </Button>
          </div>
          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : (
            <TableContainer sx={{ maxHeight: 380, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead >
                  <TableRow >
                    {["Data", "Descrição do produto", "Cod.", "Família", "UN", "Fornecedor", "UF", "Valor médio", "Ultimo valor",].map((label) => (
                      <TableCell key={label} >{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedRows.map((row, index) => (
                    <TableRow hover key={index} onClick={() => {
                      setRowData(row)
                      setIsOpen(true)
                    }}>
                      <TableCell>{row.data_cotacao_mais_recente?.split('-').join('/')}</TableCell>
                      <TableCell >{row.descricao}</TableCell>
                      <TableCell>{row.codigo_produto}</TableCell>
                      <TableCell>{row.familia}</TableCell>
                      <TableCell>{row.unidade_medida}</TableCell>
                      <TableCell>{row.nome_fantasia}</TableCell>
                      <TableCell>{row.estado}</TableCell>
                      <TableCell>{row.preco_medio_ultimas_cotacoes}</TableCell>
                      <TableCell>
                        {Number(row.cotacao_mais_recente).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
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
            labelDisplayedRows={({ from, to, count, page }) => { return `${from}-${to} de ${count}` }}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Card>
      </div>
      <Modal
        title='Detalhes do produto'
        subtitle={rowData?.descricao}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {rowData && (
          <div className={styles.modalContent}>
            <dl className={styles.definitionList}>
              {/* <dt className={styles.definitionTerm}>Fornecedor</dt><dd className={styles.definitionDescription}>{rowData.fornecedor}</dd>
              <dt className={styles.definitionTerm}>Estado</dt><dd className={styles.definitionDescription}>{rowData.estado}</dd>
              <dt className={styles.definitionTerm}>Última compra</dt><dd className={styles.definitionDescription} >{rowData.data} · {brl(rowData.valorMercadoria)}</dd>
              <dt className={styles.definitionTerm}>Valor médio (12m)</dt><dd className={styles.definitionDescription}>{brl(rowData.valorMedio)}</dd> */}
            </dl>
            <hr className={styles.divider} />
            <div>
              <AppLineChart
                label={rowData.descricao}
                xLabels={dataset.map(item => item.month)}
                data={dataset.map(item => item.valor)}
                valueFormatter={valueFormatter}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}