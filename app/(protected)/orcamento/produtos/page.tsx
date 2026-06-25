'use client';

import { useMemo, useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import * as XLSX from 'xlsx';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import {
  Autocomplete,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import AppLineChart from '@/components/Charts/AppLineChart/AppLineChart';
import { notify } from '@/lib/toast/toast';
import { getProdutos } from '@/services/produtos';
import { getFamilias } from '@/services/familias';
import { getFornecedores } from '@/services/fornecedores';
import {
  FamiliaProdutosProps,
  FornecedorProps,
  PriceHistoryProps,
  PriceProps,
  ProdutoProps,
} from './types';
import { useDebounce } from '@/hooks/useDebouncer';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import { getPriceHistory } from '@/services/historicoPrecos';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';

export default function CatalogoDeProdutos() {
  //States utilitarios
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  //States para os dados: Pagina/Modal
  const [rows, setRows] = useState<ProdutoProps[]>([]);
  const [rowData, setRowData] = useState<ProdutoProps>();
  const [priceHistory, setPriceHistory] = useState<PriceProps[]>([]);
  //States de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowCount, setRowCont] = useState(0);
  //Input Descrição
  const [descricaoInput, setDescricaoInput] = useState('');
  const descricao = useDebounce(descricaoInput, 500);
  //Input Familia de Produtos
  const [familiaProdutosSelected, setFamiliaProdutosSelected] = useState('');
  const [familiaProdutos, setFamiliaProdutos] = useState<FamiliaProdutosProps[]>([]);
  //Input Fornecedores
  const [inputFornecedor, setInputFornecedor] = useState<string>('');
  const fornecedorDebounced = useDebounce(inputFornecedor, 500);
  const [fornecedorSelected, setFornecedorSelected] = useState<FornecedorProps | null>(null);
  const [initialFornecedor, setInitialFornecedor] = useState<FornecedorProps[]>([]);
  const [fornecedor, setFornecedor] = useState<FornecedorProps[]>([]);
  const [loadingFornecedor, setLoadingFornecedor] = useState(false);
  //constante de controle da largura do gráfico
  const chartWidth = Math.max(priceHistory.length * 80, 600);

  //Notifica erros
  useEffect(() => {
    error && notify.error(error);
  }, [error]);

  //Carregamento dos filtros e dados iniciais
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [familiaData, fornecedoresData, produtosData] = await Promise.all([
          getFamilias(),
          getFornecedores(),
          getProdutos(),
        ]);
        setFamiliaProdutos(familiaData.familias_produtos);
        setFornecedor(fornecedoresData.fornecedores);
        setInitialFornecedor(fornecedoresData.fornecedores);
        setRows(produtosData.catalogo_de_produtos);
        setRowCont(produtosData.total);
      } catch (erro) {
        console.error(erro);
        setError('Erro ao carregar catálogo de produtos');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  //Autocomplete com debounce e requisições apartir do 3º caractere
  useEffect(() => {
    async function fetchFornecedores() {
      if (fornecedorDebounced.trim().length < 2) {
        setFornecedor(initialFornecedor);
        return;
      }
      try {
        setLoadingFornecedor(true);
        const { fornecedores } = await getFornecedores(fornecedorDebounced);
        setFornecedor(fornecedores);
      } catch (erro) {
        console.error(erro);
        setError('Erro ao carregar filtro de fornecedores');
      } finally {
        setLoadingFornecedor(false);
      }
    }
    fetchFornecedores();
  }, [fornecedorDebounced, initialFornecedor]);

  //Filtragem de resultados através de descrição E/OU familia de produtos E/OU fornecedor
  const filteredRows = useMemo(() => {
    const term = descricao.toLowerCase();
    return rows.filter((row) => {
      const matchDescricao = row.descricao.toLowerCase().includes(term);
      const matchFamilia = !familiaProdutosSelected || row.familia === familiaProdutosSelected;
      const matchFornecedor =
        !fornecedorSelected || row.nome_fantasia === fornecedorSelected.nome_fantasia;
      return matchDescricao && matchFamilia && matchFornecedor;
    });
  }, [descricao, rows, familiaProdutosSelected, fornecedorSelected]);

  //Atualiza Rows conforme filtros
  useEffect(() => {
    async function fetchProdutos() {
      try {
        setLoading(true);
        const response = await getProdutos({
          page: page + 1,
          limit: rowsPerPage,
          fornecedor: inputFornecedor,
          familia: familiaProdutosSelected,
          descricao: descricao,
        });
        setRows(response.catalogo_de_produtos);
        setRowCont(response.total);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProdutos();
  }, [page, rowsPerPage, inputFornecedor, familiaProdutosSelected, descricao]);

  //Funções utilitarias para os botões da página
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, 'catalogoDeProdutos.xlsx');
  };

  const limparCampos = () => {
    setFamiliaProdutosSelected('');
    setDescricaoInput('');
    setFornecedorSelected(null);
    setFornecedor(initialFornecedor);
    setInputFornecedor('');
    setPage(0);
  };

  //Carrega dados para o modal ao clicar na linha do grid
  const handleModal = async (produto: string, parceiro: string) => {
    const { historico_precos }: PriceHistoryProps = await getPriceHistory(produto, parceiro);
    const parametrized = historico_precos.map((price) => {
      return {
        ...price,
        data_cotacao: dateFormatter(price.data_cotacao),
      };
    });
    setPriceHistory(parametrized);
  };

  return (
    <>
      <PageHeader
        title="Catálogo de produtos"
        subtitle="Consulte os últimos valores praticados pelos produtos"
      />
      <PageContent>
        <Card height="fit" title="Consulta de Produtos">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              id="outlined-basic"
              label="Descrição"
              variant="outlined"
              value={descricaoInput}
              onChange={(e) => {
                setDescricaoInput(e.target.value);
              }}
            />
            <FormControl sx={{ flex: 1, minWidth: 300 }}>
              <InputLabel id="familia-produto">Família de Produtos</InputLabel>
              <Select
                labelId="familia-produto"
                id="demo-simple-select"
                value={familiaProdutosSelected}
                label="FamiliaProdutos"
                onChange={(e) => {
                  setFamiliaProdutosSelected(e.target.value);
                  setPage(0);
                }}
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
              loading={loadingFornecedor}
              options={fornecedor}
              filterOptions={(x) => x}
              getOptionKey={(fornecedor) => fornecedor.codigo_parceiro_omie}
              getOptionLabel={(fornecedor) => fornecedor.nome_fantasia}
              value={fornecedorSelected}
              inputValue={inputFornecedor}
              onChange={(_, newValue) => {
                setFornecedorSelected(newValue);
                setPage(0);
              }}
              onInputChange={(_, newInputValue) => {
                setInputFornecedor(newInputValue);
              }}
              isOptionEqualToValue={(option, value) =>
                option.codigo_parceiro_omie === value.codigo_parceiro_omie
              }
              renderInput={(params) => <TextField {...params} label="Fornecedores" />}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button variant="secondary" onClick={limparCampos}>
              Limpar Campos
            </Button>
          </div>
        </Card>
        <Card title="Produtos Encontrados" download={exportToExcel}>
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
                    {[
                      'Data',
                      'Descrição do produto',
                      'Cod.',
                      'Família',
                      'UN',
                      'Fornecedor',
                      'UF',
                      'Valor médio',
                      'Ultimo valor',
                    ].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row, index) => (
                    <TableRow
                      hover
                      key={index}
                      onClick={() => {
                        handleModal(row.id_produto_omie, row.id_parceiro_mais_recente);
                        setRowData(row);
                        setIsOpen(true);
                      }}
                    >
                      <TableCell>{row.data_cotacao_mais_recente?.split('-').join('/')}</TableCell>
                      <TableCell>{row.descricao}</TableCell>
                      <TableCell>{row.codigo_produto}</TableCell>
                      <TableCell>{row.familia}</TableCell>
                      <TableCell>{row.unidade_medida}</TableCell>
                      <TableCell>{row.nome_fantasia}</TableCell>
                      <TableCell>{row.estado}</TableCell>
                      <TableCell>{toBRL(Number(row.preco_medio_ultimas_cotacoes))}</TableCell>
                      <TableCell>{toBRL(Number(row.cotacao_mais_recente))}</TableCell>
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
        </Card>
      </PageContent>
      <Modal
        title="Detalhes do produto"
        subtitle={rowData?.descricao}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {rowData && (
          <div className={styles.modalContent} style={{ overflow: 'auto' }}>
            <div className={styles.definitionListContainer}>
              <dl className={styles.definitionList}>
                <dt className={styles.definitionTerm}>Fornecedor:</dt>
                <dd className={styles.definitionDescription}>{rowData.nome_fantasia}</dd>
                <dt className={styles.definitionTerm}>Estado:</dt>
                <dd className={styles.definitionDescription}>{rowData.estado}</dd>
                <dt className={styles.definitionTerm}>Email:</dt>
                <dd className={styles.definitionDescription}>{rowData.email}</dd>
                <dt className={styles.definitionTerm}>Telefone:</dt>
                <dd className={styles.definitionDescription}>{rowData.telefone}</dd>
              </dl>
              <dl className={styles.definitionList}>
                <dt className={styles.definitionTerm}>Cidade:</dt>
                <dd className={styles.definitionDescription}>{rowData.cidade}</dd>
                <dt className={styles.definitionTerm}>Endereço:</dt>
                <dd className={styles.definitionDescription}>
                  {rowData.logradouro}, {rowData.numero}
                </dd>
                <dt className={styles.definitionTerm}>Última compra:</dt>
                <dd className={styles.definitionDescription}>
                  {dateFormatter(rowData.data_cotacao_mais_recente)} -{' '}
                  {toBRL(Number(rowData.cotacao_mais_recente))}
                </dd>
                <dt className={styles.definitionTerm}>Valor médio:</dt>
                <dd className={styles.definitionDescription}>
                  {toBRL(Number(rowData.preco_medio_ultimas_cotacoes))}
                </dd>
              </dl>
            </div>
            <hr className={styles.divider} />
            <div className={styles.chartContainer}>
              <div
                style={{
                  width: `${chartWidth}px`,
                  minWidth: `${chartWidth}px`,
                }}
              >
                <AppLineChart
                  width={chartWidth}
                  label={rowData.descricao}
                  xLabels={priceHistory.map((item) => item.data_cotacao)}
                  data={priceHistory.map((item) => Number(item.valor_unidade))}
                  valueFormatter={toBRL}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
