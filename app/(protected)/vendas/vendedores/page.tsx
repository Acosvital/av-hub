'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import TableRow from '@mui/material/TableRow';
import {
  Autocomplete,
  Chip,
  CircularProgress,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';
import { FaPlus } from 'react-icons/fa';
import styles from './styles.module.css';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import {
  getVendedoresCadastro,
  criarVendedor,
  editarVendedor,
  deletarVendedor,
} from '@/services/vendas/vendedores';
import { getUsuarios } from '@/services/cadastros/acessos/usuarios';
import { UsuarioProps } from '@/app/(protected)/cadastros/acessos/usuarios/types';
import { FormVendedorCadastro, VendedorCadastroProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import { getUnidades, UnidadeProps } from '@/services/rh/referenciais';

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
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [usuarios, setUsuarios] = useState<UsuarioProps[]>([]);
  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormVendedorCadastro>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadUsuarios() {
      try {
        const data = await getUsuarios({ limit: 200 });
        setUsuarios(data.usuarios);
      } catch {
        notify.error('Erro ao carregar usuários');
      }
    }
    async function loadUnidades() {
      try {
        const data = await getUnidades();
        setUnidades(data.unidades);
      } catch {
        notify.error('Erro ao carregar unidades');
      }
    }
    Promise.allSettled([loadUsuarios(), loadUnidades()]);
  }, []);

  useEffect(() => {
    async function fetchVendedores() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        // Código do vendedor é só dígitos (ex.: "001") — o mesmo campo de busca
        // decide entre código e nome pelo formato do termo digitado.
        const isCodigoQuery = /^\d+$/.test(search);
        const response = await getVendedoresCadastro({
          page: page + 1,
          limit: rowsPerPage,
          codigo_vendedor_omie: isCodigoQuery && search ? search : undefined,
          nome: !isCodigoQuery && search ? search : undefined,
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
  }, [page, rowsPerPage, search, statusFiltro, refreshTrigger]);

  const usuarioLabel = (id: string | null) => {
    if (!id) return '—';
    const found = usuarios.find((u) => u.id === id);
    return found ? found.username : id;
  };

  const unidadeLabel = (id: string | null) => {
    if (!id) return '—';
    const found = unidades.find((u) => u.id === id);
    return found ? found.nome_fantasia : id;
  };

  const FILTROS_VENDEDOR = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
      ],
    },
  ];

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
      <div className={styles.pageGlow}>
        <div className={styles.pageHeaderRow}>
          <PageHeader title="Vendedores" subtitle="Gerencie os vendedores cadastrados no sistema" />
          {can('pode_criar') && (
            <Button variant="primary" icon={<FaPlus size={14} />} onClick={abrirCriacaoModal}>
              Novo
            </Button>
          )}
        </div>
        <PageContent>
          <div className={styles.tableCard}>
            <SearchFilterBar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                setPage(0);
              }}
              searchPlaceholder="Buscar por código ou nome..."
              filters={FILTROS_VENDEDOR}
              activeValues={{
                status: statusFiltro !== 'todos' ? statusFiltro : undefined,
              }}
              onFilterChange={(key, value) => {
                if (key === 'status') {
                  setStatusFiltro((value as 'ativo' | 'inativo' | null) ?? 'todos');
                  setPage(0);
                }
              }}
              glass
            />
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
                            'Nome',
                            'Email',
                            'Filial',
                            'Usuário',
                            'Comissão',
                            'Status',
                            'Sistema',
                          ].map((label) => (
                            <TableCell
                              key={label}
                              sx={{
                                background:
                                  'linear-gradient(180deg, color-mix(in srgb, var(--foreground) 6%, transparent), color-mix(in srgb, var(--foreground) 1.5%, transparent))',
                                borderBottom:
                                  '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)',
                              }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow
                            hover={can('pode_editar')}
                            key={row.id}
                            onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                            sx={{
                              cursor: can('pode_editar') ? 'pointer' : 'default',
                              '& .MuiTableCell-root': {
                                borderBottom:
                                  '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                              },
                            }}
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
                            <TableCell>{unidadeLabel(row.codigo_empresa)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
                <MobileCardList
                  rows={rows}
                  getRowKey={(row) => row.id}
                  emptyMessage="Nenhum vendedor encontrado."
                  onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
                  renderTitle={(row) => row.nome}
                  renderSubtitle={(row) => row.email ?? '—'}
                  renderBadge={(row) => (
                    <Chip
                      label={row.ativo ? 'Ativo' : 'Inativo'}
                      color={row.ativo ? 'success' : 'error'}
                      size="small"
                    />
                  )}
                  fields={(row) => [
                    { label: 'Filial', value: row.filial ?? '—' },
                    { label: 'Usuário', value: usuarioLabel(row.id_usuario) },
                    { label: 'Comissão', value: row.comissao ? 'Sim' : 'Não' },
                    { label: 'Sistema', value: unidadeLabel(row.codigo_empresa) },
                  ]}
                />
              </>
            )}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              count={rowCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={setPage}
              onRowsPerPageChange={(rpp) => {
                setRowsPerPage(rpp);
                setPage(0);
              }}
            />
          </div>
        </PageContent>
      </div>

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
            <Autocomplete
              sx={{ flex: 1, minWidth: 220 }}
              options={usuarios}
              getOptionKey={(u) => u.id}
              getOptionLabel={(u) => u.username}
              value={usuarios.find((u) => u.id === form.id_usuario) ?? null}
              onChange={(_, v) => setField('id_usuario', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Usuário Vinculado" />}
            />
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
