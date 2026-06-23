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
import { getUsuarios, criarUsuario, editarUsuario, deletarUsuario } from '@/services/usuarios';
import { FormUsuario, UsuarioProps } from './types';
import Dialog from '@/components/Ui/Dialog/Dialog';

const FORM_INICIAL: FormUsuario = {
  username: '',
  email: '',
  senha: '',
  id_funcionario: '',
  ativo: true,
};

export default function Usuarios() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [rows, setRows] = useState<UsuarioProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const username = useDebounce(usernameInput, 500);
  const email = useDebounce(emailInput, 500);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormUsuario>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const response = await getUsuarios({
          page: page + 1,
          limit: rowsPerPage,
          username,
          email,
          ativo,
        });
        console.log(response)
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
  }, [page, rowsPerPage, username, email, statusFiltro, refreshTrigger]);

  const limparFiltros = () => {
    setUsernameInput('');
    setEmailInput('');
    setStatusFiltro('todos');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (usuario: UsuarioProps) => {
    setEditingId(usuario.id);
    setForm({
      username: usuario.username,
      email: usuario.email,
      senha: '',
      id_funcionario: usuario.id_funcionario ?? '',
      ativo: usuario.ativo,
    });
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
    if (!editingId && !form.senha.trim()) {
      notify.error('Senha é obrigatória para novos usuários');
      return;
    }

    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        username: form.username.trim(),
        email: form.email.trim(),
        id_funcionario: form.id_funcionario.trim() || null,
        ativo: form.ativo,
      };
      if (form.senha.trim()) {
        payload.senha = form.senha;
      }

      if (editingId) {
        await editarUsuario(editingId, payload);
        notify.success('Usuário atualizado com sucesso');
      } else {
        await criarUsuario(payload);
        notify.success('Usuário cadastrado com sucesso');
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
      setDeleting(true);
      await deletarUsuario(editingId);
      notify.success('Usuário excluído com sucesso');
      setIsDeleteDialogOpen(false);
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  const setField = <K extends keyof FormUsuario>(field: K, value: FormUsuario[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader
        title='Usuários'
        subtitle='Gerencie os usuários com acesso ao sistema'
      />
      <PageContent>
        <Card title='Filtros' height='fit'>
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label='Nome de usuário'
              variant='outlined'
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label='E-mail'
              variant='outlined'
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFiltro}
                label='Status'
                onChange={(e) => {
                  setStatusFiltro(e.target.value as 'todos' | 'ativo' | 'inativo');
                  setPage(0);
                }}
              >
                <MenuItem value='todos'>Todos</MenuItem>
                <MenuItem value='ativo'>Ativo</MenuItem>
                <MenuItem value='inativo'>Inativo</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className={styles.cardButtons}>
            <Button variant='secondary' onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card title='Usuários Cadastrados' create={abrirCriacaoModal}>
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ maxHeight: 420, overflowX: 'auto' }}>
              <Table stickyHeader size='small'>
                <TableHead>
                  <TableRow>
                    {['Nome de usuário', 'E-mail', 'Status', 'Criado em'].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      hover
                      key={row.id}
                      onClick={() => abrirEdicaoModal(row)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{row.username}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.ativo ? 'Ativo' : 'Inativo'}
                          color={row.ativo ? 'success' : 'error'}
                          size='small'
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
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component='div'
            count={rowCount}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage='Resultados por página'
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
              label='Nome de usuário'
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
              label='E-mail'
              required
              type='email'
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
          </div>

          {/* Segurança */}
          <p className={styles.sectionTitle}>Segurança</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label='Senha'
              type='password'
              required={!editingId}
              value={form.senha}
              onChange={(e) => setField('senha', e.target.value)}
              helperText={editingId ? 'Deixe em branco para manter a senha atual' : undefined}
            />
          </div>

          {/* Vínculos */}
          <p className={styles.sectionTitle}>Vínculos</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label='ID do Funcionário'
              value={form.id_funcionario}
              onChange={(e) => setField('id_funcionario', e.target.value)}
              helperText='UUID do funcionário vinculado — opcional'
              slotProps={{ htmlInput: { pattern: '[0-9a-fA-F-]{36}' } }}
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
                  color='warning'
                />
              }
              label='Usuário Ativo'
            />
          </div>

          <div className={editingId ? styles.formActionsWithDelete : styles.formActions}>
            {editingId && (
              <Button variant='danger' onClick={() => setIsDeleteDialogOpen(true)}>
                Excluir Usuário
              </Button>
            )}
            <div className={styles.formActionsMain}>
              <Button variant='secondary' onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant='primary' onClick={salvarUsuario}>
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <Dialog
        title='Excluir Usuário'
        isLoading={deleting}
        onConfirm={excluirUsuario}
        isOpen={isDeleteDialogOpen}
        message='Tem certeza que deseja excluir o usuário? Esta ação não pode ser desfeita.'
        onClose={() => setIsDeleteDialogOpen(false)}
        confirmLabel='Excluir'
        loadingLabel='Excluindo...'
        confirmVariant='danger'
      />
    </>
  );
}
