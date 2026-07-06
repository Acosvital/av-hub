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
  getVendedoresCadastro,
  criarVendedor,
  editarVendedor,
  deletarVendedor,
} from '@/services/vendedores';
import { getUsuarios } from '@/services/usuarios';
import { UsuarioProps } from '@/app/(protected)/cadastros/acessos/usuarios/types';
import { FormVendedorCadastro, VendedorCadastroProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';

const FORM_INICIAL: FormVendedorCadastro = {
  codigo_vendedor_omie: '',
  nome: '',
  comissao: false,
  email: '',
  ajuda_custo: '',
  filial: '',
  ativo: true,
  id_usuario: '',
};

export default function Vendedores() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<VendedorCadastroProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [usuarios, setUsuarios] = useState<UsuarioProps[]>([]);

  const [codigoInput, setCodigoInput] = useState('');
  const [nomeInput, setNomeInput] = useState('');
  const codigo = useDebounce(codigoInput, 500);
  const nome = useDebounce(nomeInput, 500);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormVendedorCadastro>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadUsuarios() {
      try {
        const data = await getUsuarios({ limit: 1000 });
        setUsuarios(data.usuarios);
      } catch {
        notify.error('Erro ao carregar usuários');
      }
    }
    loadUsuarios();
  }, []);

  useEffect(() => {
    async function fetchVendedores() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const response = await getVendedoresCadastro({
          page: page + 1,
          limit: rowsPerPage,
          codigo_vendedor_omie: codigo || undefined,
          nome: nome || undefined,
          ativo,
        });
        setRows(response.data ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar vendedores');
      } finally {
        setLoading(false);
      }
    }
    fetchVendedores();
  }, [page, rowsPerPage, codigo, nome, statusFiltro, refreshTrigger]);

  const usuarioLabel = (id: string | null) => {
    if (!id) return '—';
    const found = usuarios.find((u) => u.id === id);
    return found ? found.username : id;
  };

  const limparFiltros = () => {
    setCodigoInput('');
    setNomeInput('');
    setStatusFiltro('todos');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (vendedor: VendedorCadastroProps) => {
    setEditingId(vendedor.id);
    setForm({
      codigo_vendedor_omie: vendedor.codigo_vendedor_omie,
      nome: vendedor.nome,
      comissao: vendedor.comissao,
      email: vendedor.email ?? '',
      ajuda_custo: vendedor.ajuda_custo !== null ? String(vendedor.ajuda_custo) : '',
      filial: vendedor.filial ?? '',
      ativo: vendedor.ativo,
      id_usuario: vendedor.id_usuario ?? '',
    });
    setIsModalOpen(true);
  };

  const salvarVendedor = async () => {
    if (!form.codigo_vendedor_omie.trim()) {
      notify.error('Código do vendedor é obrigatório');
      return;
    }
    if (!form.nome.trim()) {
      notify.error('Nome é obrigatório');
      return;
    }

    let ajuda_custo: number | null = null;
    if (form.ajuda_custo.trim()) {
      const parsed = Number(form.ajuda_custo.replace(',', '.'));
      if (Number.isNaN(parsed)) {
        notify.error('Ajuda de custo deve ser um número válido');
        return;
      }
      ajuda_custo = parsed;
    }

    try {
      setSaving(true);
      const payload = {
        codigo_vendedor_omie: form.codigo_vendedor_omie.trim(),
        nome: form.nome.trim(),
        comissao: form.comissao,
        email: form.email.trim() || null,
        ajuda_custo,
        filial: form.filial.trim() || null,
        ativo: form.ativo,
        id_usuario: form.id_usuario || null,
      };

      if (editingId) {
        await editarVendedor(editingId, payload);
        notify.success('Vendedor atualizado com sucesso');
      } else {
        await criarVendedor(payload);
        notify.success('Vendedor cadastrado com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar vendedor' : 'Erro ao cadastrar vendedor');
    } finally {
      setSaving(false);
    }
  };

  const excluirVendedor = async () => {
    if (!editingId) return;
    try {
      await deletarVendedor(editingId);
      notify.success('Vendedor excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir vendedor');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirVendedor,
    message: 'Tem certeza que deseja excluir o vendedor? Esta ação não pode ser desfeita.',
    title: 'Excluir Vendedor',
  });

  const setField = <K extends keyof FormVendedorCadastro>(
    field: K,
    value: FormVendedorCadastro[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader title="Vendedores" subtitle="Gerencie os vendedores cadastrados no sistema" />
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
              label="Nome"
              variant="outlined"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
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
          title="Vendedores Cadastrados"
          create={can('pode_criar') ? abrirCriacaoModal : undefined}
        >
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ maxHeight: 420, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {['Nome', 'Email', 'Filial', 'Usuário', 'Comissão', 'Status'].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
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
                      <TableCell>{row.nome}</TableCell>
                      <TableCell>{row.email ?? '—'}</TableCell>
                      <TableCell>{row.filial ?? '—'}</TableCell>
                      <TableCell>{usuarioLabel(row.id_usuario)}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.comissao ? 'Sim' : 'Não'}
                          color={row.comissao ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
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
            rowsPerPageOptions={[10, 25, 100]}
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
        </Card>
      </PageContent>

      <Modal
        title={editingId ? 'Editar Vendedor' : 'Novo Vendedor'}
        subtitle={editingId ? form.nome : 'Preencha os dados do novo vendedor'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <p className={styles.sectionTitle}>Identificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Código do Vendedor"
              required
              value={form.codigo_vendedor_omie}
              onChange={(e) => setField('codigo_vendedor_omie', e.target.value)}
              helperText="Ex: 001"
              slotProps={{ htmlInput: { maxLength: 11 } }}
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome"
              required
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              helperText="Ex: João Silva"
            />
          </div>

          <p className={styles.sectionTitle}>Contato</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              helperText="Opcional"
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Filial"
              value={form.filial}
              onChange={(e) => setField('filial', e.target.value)}
              helperText="Opcional"
            />
          </div>

          <p className={styles.sectionTitle}>Financeiro e Vínculos</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Ajuda de Custo"
              value={form.ajuda_custo}
              onChange={(e) => setField('ajuda_custo', e.target.value)}
              helperText="Opcional — valor em R$"
            />
            <FormControl sx={{ flex: 1, minWidth: 220 }}>
              <InputLabel>Usuário Vinculado</InputLabel>
              <Select
                value={form.id_usuario}
                label="Usuário Vinculado"
                onChange={(e) => setField('id_usuario', e.target.value)}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {usuarios.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.comissao}
                  onChange={(e) => setField('comissao', e.target.checked)}
                  color="warning"
                />
              }
              label="Recebe Comissão"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.ativo}
                  onChange={(e) => setField('ativo', e.target.checked)}
                  color="warning"
                />
              }
              label="Vendedor Ativo"
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Vendedor
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarVendedor}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Vendedor'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
