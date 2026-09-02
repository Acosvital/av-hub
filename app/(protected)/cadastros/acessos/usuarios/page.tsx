'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Autocomplete, Chip, CircularProgress, FormControlLabel, Switch, TextField } from '@mui/material';
import { FaPlus } from 'react-icons/fa';
import styles from './styles.module.css';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import {
  getUsuarios,
  criarUsuario,
  editarUsuario,
  deletarUsuario,
  getUsuarioUnidades,
  editarUsuarioUnidades,
} from '@/services/cadastros/acessos/usuarios';
import { getFuncionarios } from '@/services/rh/funcionarios';
import { FuncionarioProps } from '@/app/(protected)/rh/funcionarios/types';
import { getUnidades } from '@/services/cadastros/auxiliares/unidades';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { FormUsuario, UsuarioProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';

const FORM_INICIAL: FormUsuario = {
  username: '',
  email: '',
  senha: '',
  id_funcionario: '',
  ativo: true,
  setor_irrestrito: false,
};

export default function Usuarios() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<UsuarioProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [funcionarios, setFuncionarios] = useState<FuncionarioProps[]>([]);
  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<UnidadeProps[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormUsuario>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadFuncionarios() {
      try {
        const { funcionarios: lista } = await getFuncionarios({ limit: 500 });
        setFuncionarios(lista ?? []);
      } catch {
        notify.error('Erro ao carregar funcionários');
      }
    }
    async function loadUnidades() {
      try {
        const { unidades: lista } = await getUnidades({ limit: 500 });
        setUnidades(lista ?? []);
      } catch {
        notify.error('Erro ao carregar unidades');
      }
    }
    loadFuncionarios();
    loadUnidades();
  }, []);

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const isEmailQuery = /@/.test(search);
        const response = await getUsuarios({
          page: page + 1,
          limit: rowsPerPage,
          username: !isEmailQuery && search ? search : undefined,
          email: isEmailQuery && search ? search : undefined,
          ativo,
        });
        setRows(response.usuarios ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    }
    fetchUsuarios();
  }, [page, rowsPerPage, search, statusFiltro, refreshTrigger]);

  const FILTROS_USUARIO = [
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
    setUnidadesSelecionadas([]);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = async (usuario: UsuarioProps) => {
    setEditingId(usuario.id);
    setForm({
      username: usuario.username,
      email: usuario.email,
      senha: '',
      id_funcionario: usuario.id_funcionario ?? '',
      ativo: usuario.ativo,
      setor_irrestrito: usuario.setor_irrestrito,
    });

    setUnidadesSelecionadas([]);
    try {
      const { unidades: idsVinculados } = await getUsuarioUnidades(usuario.id);
      setUnidadesSelecionadas(unidades.filter((u) => idsVinculados.includes(u.id)));
    } catch {
      // best-effort — se falhar, o campo só volta vazio (sem restrição visível aqui)
    }

    setIsModalOpen(true);
  };

  const salvarUsuario = async () => {
    if (!form.username.trim()) {
      notify.error('Nome de usuário é obrigatório');
      return;
    }
    if (form.username.length > 255) {
      notify.error('Nome de usuário deve ter no máximo 255 caracteres');
      return;
    }
    if (!form.email.trim()) {
      notify.error('E-mail é obrigatório');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      notify.error('E-mail inválido');
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        username: form.username.trim(),
        email: form.email.trim(),
        id_funcionario: form.id_funcionario.trim() || null,
        ativo: form.ativo,
        setor_irrestrito: form.setor_irrestrito,
      };
      if (!editingId && form.senha.trim()) {
        payload.senha = form.senha;
      }

      let novoId = editingId;
      if (editingId) {
        await editarUsuario(editingId, payload);
        notify.success('Usuário atualizado com sucesso');
      } else {
        const criado = (await criarUsuario(payload)) as { id: string };
        novoId = criado.id;
        notify.success('Usuário cadastrado com sucesso');
      }

      if (novoId) {
        try {
          await editarUsuarioUnidades(
            novoId,
            unidadesSelecionadas.map((u) => u.id)
          );
        } catch (err) {
          console.error('Falha ao atualizar unidades do usuário', err);
          notify.error('Usuário salvo, mas houve falha ao atualizar as unidades vinculadas');
        }
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar usuário' : 'Erro ao cadastrar usuário');
    } finally {
      setSaving(false);
    }
  };

  const excluirUsuario = async () => {
    if (!editingId) return;
    try {
      await deletarUsuario(editingId);
      notify.success('Usuário excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir usuário');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirUsuario,
    message: 'Tem certeza que deseja excluir o usuário? Esta ação não pode ser desfeita.',
    title: 'Excluir Usuário',
  });

  const setField = <K extends keyof FormUsuario>(field: K, value: FormUsuario[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Usuários" subtitle="Gerencie os usuários com acesso ao sistema" />
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
            searchPlaceholder="Buscar por usuário ou e-mail..."
            filters={FILTROS_USUARIO}
            activeValues={{ status: statusFiltro !== 'todos' ? statusFiltro : undefined }}
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
                    {['Nome de usuário', 'E-mail', 'Status', 'Criado em'].map((label) => (
                      <TableCell
                        key={label}
                        sx={{
                          background:
                            'linear-gradient(180deg, color-mix(in srgb, var(--foreground) 6%, transparent), color-mix(in srgb, var(--foreground) 1.5%, transparent))',
                          borderBottom: '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)',
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
                          borderBottom: '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                        },
                      }}
                    >
                      <TableCell>{row.username}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.ativo ? 'Ativo' : 'Inativo'}
                          color={row.ativo ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString('pt-BR')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </div>
            <MobileCardList
              rows={rows}
              getRowKey={(row) => row.id}
              emptyMessage="Nenhum usuário encontrado."
              onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
              renderTitle={(row) => row.username}
              renderSubtitle={(row) => row.email}
              renderBadge={(row) => (
                <Chip
                  label={row.ativo ? 'Ativo' : 'Inativo'}
                  color={row.ativo ? 'success' : 'error'}
                  size="small"
                />
              )}
              fields={(row) => [
                {
                  label: 'Criado em',
                  value: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : '—',
                },
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
        title={editingId ? 'Editar Usuário' : 'Novo Usuário'}
        subtitle={editingId ? form.username : 'Preencha os dados do novo usuário'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          {/* Identificação */}
          <p className={styles.sectionTitle}>Identificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Nome de usuário"
              required
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              slotProps={{ htmlInput: { maxLength: 255 } }}
              helperText={`${form.username.length}/255`}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="E-mail"
              required
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
          </div>

          {/* Segurança — somente na criação */}
          {!editingId && (
            <>
              <p className={styles.sectionTitle}>Segurança</p>
              <hr className={styles.divider} />
              <div className={styles.formRow}>
                <TextField
                  sx={{ flex: 1, minWidth: 260 }}
                  label="Senha inicial"
                  type="password"
                  value={form.senha}
                  onChange={(e) => setField('senha', e.target.value)}
                  helperText="Opcional — deixe em branco para usuários que acessam via Microsoft"
                />
              </div>
            </>
          )}

          {/* Vínculos */}
          <p className={styles.sectionTitle}>Vínculos</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={funcionarios}
              getOptionKey={(f) => f.id}
              getOptionLabel={(f) => `${f.nome_completo}${f.email ? ` — ${f.email}` : ''}`}
              value={funcionarios.find((f) => f.id === form.id_funcionario) ?? null}
              onChange={(_, v) => setField('id_funcionario', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Funcionário vinculado"
                  placeholder="Busque por nome ou e-mail"
                  helperText="Sem funcionário vinculado, o usuário não visualiza a tela de Funcionários. Com o vínculo, o acesso é restrito ao setor do funcionário."
                />
              )}
            />
          </div>
          <div className={styles.formRow}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.setor_irrestrito}
                  onChange={(e) => setField('setor_irrestrito', e.target.checked)}
                  color="warning"
                />
              }
              label="Acesso a todos os setores"
            />
          </div>
          <div className={styles.formRow}>
            <Autocomplete
              multiple
              sx={{ flex: 1, minWidth: 260 }}
              options={unidades}
              getOptionKey={(u) => u.id}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidadesSelecionadas}
              onChange={(_, v) => setUnidadesSelecionadas(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Unidades"
                  placeholder="Todas (sem restrição)"
                  helperText="Restringe o que este usuário vê/gerencia às unidades selecionadas (matriz e/ou filiais). Sem seleção, o acesso é irrestrito por unidade."
                />
              )}
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
              label="Usuário Ativo"
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Usuário
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarUsuario}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
