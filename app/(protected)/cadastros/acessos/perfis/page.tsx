'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { CircularProgress, TextField } from '@mui/material';
import styles from './styles.module.css';
import Card from '@/components/Ui/Card/Card';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { usePermission } from '@/hooks/usePermission';
import { getPerfis, criarPerfil, editarPerfil, deletarPerfil } from '@/services/cadastros/acessos/perfis';
import { FormPerfil, PerfilProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';

const FORM_INICIAL: FormPerfil = {
  nome: '',
  descricao: '',
};

export default function Perfis() {
  //custom hook que faz a verificação de permissões dos usuários:
  const { can } = usePermission();

  //states de loading:
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  //state utilizado para controlar a atualização dos resultados ao criar/editar:
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [rows, setRows] = useState<PerfilProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const [form, setForm] = useState<FormPerfil>(FORM_INICIAL);

  //Função auxiliar para alertar erros;
  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  //Carrega os dados iniciais e ao filtrar;
  useEffect(() => {
    async function fetchPerfis() {
      try {
        setLoading(true);
        const response = await getPerfis({
          page: page + 1,
          limit: rowsPerPage,
          nome,
        });
        setRows(response.perfis ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar perfis');
      } finally {
        setLoading(false);
      }
    }
    fetchPerfis();
  }, [page, rowsPerPage, nome, refreshTrigger]);

  const limparFiltros = () => {
    setNomeInput('');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (perfil: PerfilProps) => {
    setEditingId(perfil.id);
    setForm({
      nome: perfil.nome,
      descricao: perfil.descricao ?? '',
    });
    setIsModalOpen(true);
  };

  const salvarPerfil = async () => {
    // Validações de preenchimento dos campos:
    if (!form.nome.trim()) {
      notify.error('Nome é obrigatório');
      return;
    }
    if (form.nome.length > 50) {
      notify.error('Nome deve ter no máximo 50 caracteres');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nome: form.nome,
        descricao: form.descricao?.trim() || null,
      };

      if (editingId) {
        await editarPerfil(editingId, payload);
        notify.success('Perfil atualizado com sucesso');
      } else {
        await criarPerfil(payload);
        notify.success('Perfil cadastrado com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar perfil' : 'Erro ao cadastrar perfil');
    } finally {
      setSaving(false);
    }
  };
  const excluirPerfil = async () => {
    if (!editingId) return;
    try {
      await deletarPerfil(editingId);
      notify.success('Perfil excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir perfil');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirPerfil,
    message: 'Tem certeza que deseja excluir o perfil? Esta ação não pode ser desfeita.',
    title: 'Excluir Perfil',
  });

  //Função utilitária para mapear os tipos aceitos no FormPerfil para o setForm
  const setField = <K extends keyof FormPerfil>(field: K, value: FormPerfil[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader title="Perfis" subtitle="Gerencie os perfis de acesso dos usuários do sistema" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label="Nome"
              variant="outlined"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button variant="secondary" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card title="Perfis Cadastrados" create={can('pode_criar') ? abrirCriacaoModal : undefined}>
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
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {['Nome', 'Descrição', 'Criado em'].map((label) => (
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
                      <TableCell>{row.descricao ?? '—'}</TableCell>
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
            sx={{
              flexShrink: 0,
              borderTop: '1px solid var(--border)',
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
        title={editingId ? 'Editar Perfil' : 'Novo Perfil'}
        subtitle={editingId ? form.nome : 'Preencha os dados do novo perfil'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <p className={styles.sectionTitle}>Identificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Nome"
              required
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              slotProps={{ htmlInput: { maxLength: 50 } }}
              helperText={`${form.nome.length}/50`}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Descrição"
              multiline
              minRows={3}
              value={form.descricao}
              onChange={(e) => setField('descricao', e.target.value)}
              helperText="Opcional — descreva as permissões ou finalidade deste perfil"
            />
          </div>
          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Perfil
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarPerfil}
                disabled={saving}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Perfil'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
