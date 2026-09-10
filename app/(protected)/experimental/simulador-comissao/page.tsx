'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { LuTrash2, LuPlus, LuSearch } from 'react-icons/lu';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import Card from '@/components/Ui/Card/Card';
import Button from '@/components/Ui/Button/Button';
import Modal from '@/components/Ui/Modal/Modal';
import toBRL from '@/utils/toBRL';
import normalizeText from '@/utils/normalizeText';
import styles from './styles.module.css';
import { CONDICOES_PAGAMENTO, ICMS_POR_UF, ORIGEM_COMPRA, OrigemCompra } from './_data/referencia';
import { calcularPedido } from './_lib/calculo';
import { CabecalhoPedido, ItemPedido, ResultadoPedido } from './types';
import { getProdutos } from '@/services/orcamento/historicoProdutos';
import { ProdutoProps } from '@/app/(protected)/orcamento/historico-produtos/types';
import { getTodosFornecedores } from '@/services/orcamento/todosFornecedores';
import { ParceirosProps } from '@/app/(protected)/orcamento/fornecedores/types';

const novoItem = (id: string = crypto.randomUUID()): ItemPedido => ({
  id,
  descricao: '',
  quantidade: 1,
  um: 'PÇ',
  precoUnitCompra: 0,
  fornecedor: '',
  origemCompra: 'São Paulo',
  percentIPI: 0,
  valorST: 0,
  precoUnitVenda: null,
});

// Id fixo pro item que já nasce na tela (1º render, servidor e client
// precisam bater). crypto.randomUUID() só entra pros itens adicionados
// depois, via clique — aí já é client-only, sem risco de hidratação.
const ITEM_INICIAL_ID = 'item-inicial';

const cabecalhoInicial: CabecalhoPedido = {
  cliente: '',
  numeroPedido: '',
  ufDestino: 'São Paulo',
  isentoImposto: false,
  condicaoPagamento: 'À Vista',
  valorFreteVenda: 0,
  valorSTPedido: 0,
  impostoRetidoDifal: 0,
};

const toPercentString = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

const letraClass: Record<string, string> = {
  A: styles.letraA,
  B: styles.letraB,
  C: styles.letraC,
  D: styles.letraD,
};

const itemStatusClass: Record<string, string> = {
  'PEDIDO OK': styles.itemStatusOk,
  NEGOCIAR: styles.itemStatusNegociar,
  'PREJUÍZO': styles.itemStatusPrejuizo,
};

export default function SimuladorComissao() {
  const [header, setHeader] = useState<CabecalhoPedido>(cabecalhoInicial);
  const [itens, setItens] = useState<ItemPedido[]>([novoItem(ITEM_INICIAL_ID)]);
  const [resultado, setResultado] = useState<ResultadoPedido | null>(null);
  const [catalogo, setCatalogo] = useState<ProdutoProps[]>([]);
  const [fornecedores, setFornecedores] = useState<ParceirosProps[]>([]);
  const [itemBuscandoFornecedor, setItemBuscandoFornecedor] = useState<string | null>(null);
  const [buscaFornecedor, setBuscaFornecedor] = useState('');

  useEffect(() => {
    getProdutos()
      .then((res) => setCatalogo(res.catalogo_de_produtos))
      .catch((err) => console.error('Erro ao carregar catálogo de produtos', err));
    getTodosFornecedores()
      .then((res) => setFornecedores(res.fornecedores))
      .catch((err) => console.error('Erro ao carregar catálogo de fornecedores', err));
  }, []);

  const produtosOrdenados = useMemo(
    () => [...catalogo].sort((a, b) => a.descricao.localeCompare(b.descricao)),
    [catalogo]
  );

  const fornecedoresFiltrados = useMemo(() => {
    const termo = normalizeText(buscaFornecedor);
    if (!termo) return [];
    const termoDigitos = termo.replace(/\D/g, '');
    return fornecedores
      .filter(
        (f) =>
          normalizeText(f.nome_fantasia).includes(termo) ||
          normalizeText(f.razao_social).includes(termo) ||
          (termoDigitos !== '' && f.cpf_cnpj.replace(/\D/g, '').includes(termoDigitos))
      )
      .slice(0, 50);
  }, [fornecedores, buscaFornecedor]);

  const abrirBuscaFornecedor = (itemId: string) => {
    setItemBuscandoFornecedor(itemId);
    setBuscaFornecedor('');
  };

  const selecionarFornecedor = (fornecedor: ParceirosProps) => {
    if (itemBuscandoFornecedor) {
      atualizarItem(itemBuscandoFornecedor, 'fornecedor', fornecedor.nome_fantasia);
    }
    setItemBuscandoFornecedor(null);
  };

  const atualizarHeader = <K extends keyof CabecalhoPedido>(campo: K, valor: CabecalhoPedido[K]) => {
    setHeader((prev) => ({ ...prev, [campo]: valor }));
    setResultado(null);
  };

  const atualizarItem = <K extends keyof ItemPedido>(id: string, campo: K, valor: ItemPedido[K]) => {
    setItens((prev) => prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
    setResultado(null);
  };

  const preencherComProduto = (id: string, produto: ProdutoProps | null) => {
    if (!produto) return;
    const precoUltimaCotacao = Number(produto.cotacao_mais_recente);
    setItens((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              descricao: produto.descricao,
              um: produto.unidade_medida || item.um,
              fornecedor: produto.nome_fantasia || item.fornecedor,
              precoUnitCompra: Number.isFinite(precoUltimaCotacao)
                ? precoUltimaCotacao
                : item.precoUnitCompra,
            }
          : item
      )
    );
    setResultado(null);
  };

  const adicionarItem = () => setItens((prev) => [...prev, novoItem()]);
  const removerItem = (id: string) => {
    setItens((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
    setResultado(null);
  };

  const calcular = () => setResultado(calcularPedido(header, itens));

  return (
    <>
      <PageHeader
        title="Simulador de Comissão"
        subtitle="Protótipo local — substitui a planilha de custo/comissão manual. Ainda não conectado ao backend."
      />
      <PageContent>
        <Card title="Dados do Pedido" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              className={styles.field}
              label="Cliente"
              value={header.cliente}
              onChange={(e) => atualizarHeader('cliente', e.target.value)}
            />
            <TextField
              className={styles.fieldSmall}
              label="Nº do Pedido"
              value={header.numeroPedido}
              onChange={(e) => atualizarHeader('numeroPedido', e.target.value)}
            />
            <FormControl className={styles.fieldSmall}>
              <InputLabel id="uf-destino-label">Estado Destino</InputLabel>
              <Select
                labelId="uf-destino-label"
                label="Estado Destino"
                value={header.ufDestino}
                onChange={(e) => atualizarHeader('ufDestino', e.target.value)}
              >
                {ICMS_POR_UF.map((u) => (
                  <MenuItem key={u.uf} value={u.uf}>
                    {u.uf}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl className={styles.fieldSmall}>
              <InputLabel id="cond-pag-label">Cond. de Pagamento</InputLabel>
              <Select
                labelId="cond-pag-label"
                label="Cond. de Pagamento"
                value={header.condicaoPagamento}
                onChange={(e) => atualizarHeader('condicaoPagamento', e.target.value)}
              >
                {CONDICOES_PAGAMENTO.map((c) => (
                  <MenuItem key={c.label} value={c.label}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={header.isentoImposto}
                  onChange={(e) => atualizarHeader('isentoImposto', e.target.checked)}
                />
              }
              label="Isento de imposto?"
            />
          </div>
          <div className={styles.inputContainers}>
            <TextField
              className={styles.fieldSmall}
              label="Frete na venda (R$)"
              type="number"
              value={header.valorFreteVenda}
              onChange={(e) => atualizarHeader('valorFreteVenda', Number(e.target.value))}
            />
            <TextField
              className={styles.fieldSmall}
              label="Valor ST do pedido (R$)"
              type="number"
              value={header.valorSTPedido}
              onChange={(e) => atualizarHeader('valorSTPedido', Number(e.target.value))}
            />
            <TextField
              className={styles.fieldSmall}
              label="Imposto Retido/DIFAL (R$)"
              type="number"
              value={header.impostoRetidoDifal}
              onChange={(e) => atualizarHeader('impostoRetidoDifal', Number(e.target.value))}
            />
          </div>
        </Card>

        <Card title="Itens do Pedido" height="fit">
          <div className={styles.itemsHeader}>
            <span>Preço de venda em branco = usa o preço sugerido (markup automático)</span>
            <Button variant="secondary" onClick={adicionarItem} icon={<LuPlus size={16} />}>
              Adicionar item
            </Button>
          </div>

          <div className={styles.itemCards}>
            {itens.map((item, index) => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemCardHeader}>
                  <span className={styles.itemCardIndex}>Item {index + 1}</span>
                  <IconButton
                    size="small"
                    onClick={() => removerItem(item.id)}
                    disabled={itens.length === 1}
                    title="Remover item"
                  >
                    <LuTrash2 size={16} />
                  </IconButton>
                </div>

                <Autocomplete
                  options={produtosOrdenados}
                  getOptionLabel={(p) => p.descricao}
                  getOptionKey={(p) => p.id_produto_omie}
                  onChange={(_, produto) => preencherComProduto(item.id, produto)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar no catálogo de produtos"
                      placeholder="Digite pra puxar descrição, UM, fornecedor e última cotação"
                    />
                  )}
                  renderOption={(props, produto) => (
                    <li {...props} key={produto.id_produto_omie}>
                      <div>
                        <div>{produto.descricao}</div>
                        <div className={styles.optionSubtext}>
                          {produto.codigo_produto} · {produto.unidade_medida} ·{' '}
                          {produto.nome_fantasia} · última cotação {toBRL(produto.cotacao_mais_recente)}
                        </div>
                      </div>
                    </li>
                  )}
                  className={styles.produtoAutocomplete}
                />

                <TextField
                  className={styles.itemDescricao}
                  label="Descrição"
                  multiline
                  minRows={2}
                  value={item.descricao}
                  onChange={(e) => atualizarItem(item.id, 'descricao', e.target.value)}
                />

                <TextField
                  className={styles.itemFornecedor}
                  label="Fornecedor"
                  value={item.fornecedor}
                  placeholder="Clique pra buscar por nome ou CNPJ"
                  onClick={() => abrirBuscaFornecedor(item.id)}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: <LuSearch size={16} />,
                    },
                  }}
                />

                <div className={styles.itemGrid}>
                  <TextField
                    label="Qtd."
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(item.id, 'quantidade', Number(e.target.value))}
                  />
                  <TextField
                    label="UM"
                    value={item.um}
                    onChange={(e) => atualizarItem(item.id, 'um', e.target.value)}
                  />
                  <TextField
                    label="Preço Unit. Compra"
                    type="number"
                    value={item.precoUnitCompra}
                    onChange={(e) => atualizarItem(item.id, 'precoUnitCompra', Number(e.target.value))}
                  />
                  <FormControl>
                    <InputLabel id={`origem-${item.id}`}>Origem da Compra</InputLabel>
                    <Select
                      labelId={`origem-${item.id}`}
                      label="Origem da Compra"
                      value={item.origemCompra}
                      onChange={(e) =>
                        atualizarItem(item.id, 'origemCompra', e.target.value as OrigemCompra)
                      }
                    >
                      {ORIGEM_COMPRA.map((o) => (
                        <MenuItem key={o} value={o}>
                          {o}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="% IPI"
                    type="number"
                    value={item.percentIPI * 100}
                    onChange={(e) => atualizarItem(item.id, 'percentIPI', Number(e.target.value) / 100)}
                  />
                  <TextField
                    label="Valor ST"
                    type="number"
                    value={item.valorST}
                    onChange={(e) => atualizarItem(item.id, 'valorST', Number(e.target.value))}
                  />
                  <TextField
                    label="Preço Unit. Venda"
                    type="number"
                    placeholder="sugerido"
                    value={item.precoUnitVenda ?? ''}
                    onChange={(e) =>
                      atualizarItem(
                        item.id,
                        'precoUnitVenda',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className={styles.calcularContainer}>
          <Button variant="primary" onClick={calcular}>
            Calcular Comissão
          </Button>
        </div>

        {resultado && (
          <Card title="Resultado do Pedido" height="fit">
            <div className={styles.resultado}>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Valor de Venda</span>
                <span className={styles.kpiValue}>{toBRL(resultado.valorVendaRealTotal)}</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Margem Líquida Real</span>
                <span
                  className={styles.kpiValue}
                  style={{ color: resultado.margemLiquidaReal <= 0 ? '#c62828' : undefined }}
                >
                  {toPercentString(resultado.margemLiquidaReal)}
                </span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Letra</span>
                <span className={`${styles.letraBadge} ${letraClass[resultado.letra]}`}>
                  {resultado.letra}
                </span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Status</span>
                <span
                  className={resultado.statusPedido === 'PREJUÍZO' ? styles.statusPrejuizo : styles.statusOk}
                >
                  {resultado.statusPedido}
                </span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>% Comissão</span>
                <span className={styles.kpiValue}>{toPercentString(resultado.comissaoPercent)}</span>
              </div>
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Comissão (R$)</span>
                <span className={styles.kpiValue}>{toBRL(resultado.comissaoReais)}</span>
              </div>
            </div>

            {resultado.statusPedido === 'PREJUÍZO' && (
              <p className={styles.aviso}>
                Margem líquida real ≤ 0% — pedido classificado como prejuízo, comissão zerada
                independente da letra.
              </p>
            )}

            <div className={styles.tableWrapper}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Custo Líquido</TableCell>
                      <TableCell>Preço Sugerido (un.)</TableCell>
                      <TableCell>Preço de Venda (un.)</TableCell>
                      <TableCell>Total Venda</TableCell>
                      <TableCell>Margem</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultado.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.descricao || '—'}</TableCell>
                        <TableCell>{toBRL(item.totalLiquidoCompra)}</TableCell>
                        <TableCell>{toBRL(item.precoUnitSugerido)}</TableCell>
                        <TableCell>{toBRL(item.precoUnitVendaEfetivo)}</TableCell>
                        <TableCell>{toBRL(item.valorVendaTotal)}</TableCell>
                        <TableCell>{toPercentString(item.margemItem)}</TableCell>
                        <TableCell>
                          <span className={`${styles.itemStatus} ${itemStatusClass[item.statusItem]}`}>
                            {item.statusItem}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </Card>
        )}
      </PageContent>

      <Modal
        title="Buscar fornecedor"
        subtitle="Digite nome fantasia, razão social ou CNPJ"
        isOpen={itemBuscandoFornecedor !== null}
        onClose={() => setItemBuscandoFornecedor(null)}
      >
        <div className={styles.modalBuscaFornecedor}>
          <TextField
            autoFocus
            fullWidth
            label="Nome ou CNPJ"
            value={buscaFornecedor}
            onChange={(e) => setBuscaFornecedor(e.target.value)}
          />
          <div className={styles.listaFornecedores}>
            {buscaFornecedor.trim() === '' ? (
              <p className={styles.aviso}>Digite pra buscar no catálogo de fornecedores.</p>
            ) : fornecedoresFiltrados.length === 0 ? (
              <p className={styles.aviso}>Nenhum fornecedor encontrado.</p>
            ) : (
              fornecedoresFiltrados.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={styles.fornecedorOpcao}
                  onClick={() => selecionarFornecedor(f)}
                >
                  <span className={styles.fornecedorNome}>{f.nome_fantasia}</span>
                  <span className={styles.optionSubtext}>
                    {f.razao_social} · {f.cpf_cnpj} · {f.cidade}/{f.estado}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
