'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import {
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import {
  getProdutosCadastro,
  criarProduto,
  editarProduto,
  deletarProduto,
} from '@/services/cadastros/auxiliares/produtos';
import { getFamilias } from '@/services/orcamento/familias';
import { FormProdutoCadastro, ProdutoCadastroProps } from './types';
import { FamiliaProdutosProps } from '@/app/(protected)/orcamento/historico-produtos/types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';

const FORM_INICIAL: FormProdutoCadastro = {
  codigo_produto: '',
  id_produto_omie: '',
  descricao: '',
  familias_produtos: '',
  unidade_medida: '',
  ncm: '',
  especificacoes: '',
  ativo: true,
};

export default function Produtos() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<ProdutoCadastroProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [familias, setFamilias] = useState<FamiliaProdutosProps[]>([]);

  const [codigoInput, setCodigoInput] = useState('');
  const [descricaoInput, setDescricaoInput] = useState('');
  const codigo = useDebounce(codigoInput, 500);
  const descricao = useDebounce(descricaoInput, 500);
  const [familiaFiltro, setFamiliaFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormProdutoCadastro>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadFamilias() {
      try {
        const data = await getFamilias();
        setFamilias(data.familias_produtos);
      } catch {
        notify.error('Erro ao carregar famílias de produtos');
      }
    }
    loadFamilias();
  }, []);

  useEffect(() => {
    async function fetchProdutos() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const response = await getProdutosCadastro({
          page: page + 1,
          limit: rowsPerPage,
          codigo_produto: codigo || undefined,
          descricao: descricao || undefined,
          familias_produtos: familiaFiltro || undefined,
          ativo,
        });
        setRows(response.produtos ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar produtos');
      } finally {
        setLoading(false);
      }
    }
    fetchProdutos();
  }, [page, rowsPerPage, codigo, descricao, familiaFiltro, statusFiltro, refreshTrigger]);

  const familiaLabel = (codigo: string) => {
    const found = familias.find((f) => f.codigo_fprodutos === codigo);
    return found ? found.nome : codigo;
  };

  const limparFiltros = () => {
    setCodigoInput('');
    setDescricaoInput('');
    setFamiliaFiltro('');
    setStatusFiltro('todos');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (produto: ProdutoCadastroProps) => {
    setEditingId(produto.id);
    setForm({
      codigo_produto: produto.codigo_produto,
      id_produto_omie: produto.id_produto_omie ?? '',
      descricao: produto.descricao,
      familias_produtos: produto.familias_produtos,
      unidade_medida: produto.unidade_medida ?? '',
      ncm: produto.ncm ?? '',
      especificacoes:
        produto.especificacoes && Object.keys(produto.especificacoes).length > 0
          ? JSON.stringify(produto.especificacoes, null, 2)
          : '',
      ativo: produto.ativo,
    });
    setIsModalOpen(true);
  };

  const salvarProduto = async () => {
    if (!form.codigo_produto.trim()) {
      notify.error('Código do produto é obrigatório');
      return;
    }
    if (!form.descricao.trim()) {
      notify.error('Descrição é obrigatória');
      return;
    }
    if (!form.familias_produtos) {
      notify.error('Família de produtos é obrigatória');
      return;
    }

    let especificacoes: Record<string, unknown> = {};
    if (form.especificacoes.trim()) {
      try {
        especificacoes = JSON.parse(form.especificacoes);
      } catch {
        notify.error('Especificações deve ser um JSON válido');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        codigo_produto: form.codigo_produto.trim().toUpperCase(),
        id_produto_omie: form.id_produto_omie.trim() || null,
        descricao: form.descricao.trim(),
        familias_produtos: form.familias_produtos,
        unidade_medida: form.unidade_medida.trim() || null,
        ncm: form.ncm.trim() || null,
        especificacoes,
        ativo: form.ativo,
      };

      if (editingId) {
        await editarProduto(editingId, payload);
        notify.success('Produto atualizado com sucesso');
      } else {
        await criarProduto(payload);
        notify.success('Produto cadastrado com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar produto' : 'Erro ao cadastrar produto');
    } finally {
      setSaving(false);
    }
  };

  const excluirProduto = async () => {
    if (!editingId) return;
    try {
      await deletarProduto(editingId);
      notify.success('Produto excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir produto');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirProduto,
    message: 'Tem certeza que deseja excluir o produto? Esta ação não pode ser desfeita.',
    title: 'Excluir Produto',
  });

  const setField = <K extends keyof FormProdutoCadastro>(
    field: K,
    value: FormProdutoCadastro[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader title="Produtos" subtitle="Gerencie os produtos cadastrados no sistema" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Código"
              variant="outlined"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Descrição"
              variant="outlined"
              value={descricaoInput}
              onChange={(e) => setDescricaoInput(e.target.value)}
            />
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Família</InputLabel>
              <Select
                value={familiaFiltro}
                label="Família"
                onChange={(e) => {
                  setFamiliaFiltro(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {familias.map((f) => (
                  <MenuItem key={f.codigo_fprodutos} value={f.codigo_fprodutos}>
                    {f.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFiltro}
                label="Status"
                onChange={(e) => {
                  setStatusFiltro(e.target.value as 'todos' | 'ativo' | 'inativo');
                  setPage(0);
                }}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="inativo">Inativo</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className={styles.cardButtons}>
            <Button variant="secondary" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card
          title="Produtos Cadastrados"
          create={can('pode_criar') ? abrirCriacaoModal : undefined}
        >
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
                    {['Código', 'Descrição', 'Família', 'Unid. Medida', 'NCM', 'Status'].map(
                      (label) => (
                        <TableCell key={label}>{label}</TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      hover={can('pode_editar')}
                      key={row.id}
                      onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                      sx={{ cursor: can('pode_editar') ? 'pointer' : 'default' }}
                    >
                      <TableCell>{row.codigo_produto}</TableCell>
                      <TableCell>{row.descricao}</TableCell>
                      <TableCell>{familiaLabel(row.familias_produtos)}</TableCell>
                      <TableCell>{row.unidade_medida ?? '—'}</TableCell>
                      <TableCell>{row.ncm ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.ativo ? 'Ativo' : 'Inativo'}
                          color={row.ativo ? 'success' : 'error'}
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

      <Modal
        title={editingId ? 'Editar Produto' : 'Novo Produto'}
        subtitle={editingId ? form.descricao : 'Preencha os dados do novo produto'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          {/* Identificação */}
          <p className={styles.sectionTitle}>Identificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Código do Produto"
              required
              value={form.codigo_produto}
              onChange={(e) => setField('codigo_produto', e.target.value.toUpperCase())}
              helperText="Ex: FLG-304-2"
            />
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="ID Omie"
              value={form.id_produto_omie}
              onChange={(e) => setField('id_produto_omie', e.target.value)}
              helperText="Opcional"
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1 }}
              label="Descrição"
              required
              value={form.descricao}
              onChange={(e) => setField('descricao', e.target.value)}
              helperText="Ex: Flange Aço Inox 304 2 polegadas"
            />
          </div>

          {/* Classificação */}
          <p className={styles.sectionTitle}>Classificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControl sx={{ flex: 1, minWidth: 200 }} required>
              <InputLabel>Família de Produtos</InputLabel>
              <Select
                value={form.familias_produtos}
                label="Família de Produtos"
                onChange={(e) => setField('familias_produtos', e.target.value)}
              >
                {familias.map((f) => (
                  <MenuItem key={f.codigo_fprodutos} value={f.codigo_fprodutos}>
                    {f.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              sx={{ minWidth: 110 }}
              label="Unid. Medida"
              value={form.unidade_medida}
              onChange={(e) => setField('unidade_medida', e.target.value.toUpperCase())}
              helperText="Ex: PÇ, UN, KG"
              slotProps={{ htmlInput: { maxLength: 10 } }}
            />
            <TextField
              sx={{ minWidth: 150 }}
              label="NCM"
              value={form.ncm}
              onChange={(e) => setField('ncm', e.target.value.replace(/\D/g, ''))}
              helperText="8 dígitos numéricos"
              slotProps={{ htmlInput: { maxLength: 8 } }}
            />
          </div>

          {/* Especificações */}
          <p className={styles.sectionTitle}>Especificações</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1 }}
              label="Especificações (JSON)"
              multiline
              minRows={3}
              value={form.especificacoes}
              onChange={(e) => setField('especificacoes', e.target.value)}
              helperText={'Opcional — ex: {"pressao": "300 PSI", "material": "AISI 304"}'}
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
            />
          </div>

          {/* Configuração */}
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.ativo}
                  onChange={(e) => setField('ativo', e.target.checked)}
                  color="warning"
                />
              }
              label="Produto Ativo"
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Produto
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarProduto}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
