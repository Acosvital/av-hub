'use client';

import { useEffect, useMemo, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import {
  Autocomplete,
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
import { getTelas, criarTela, editarTela, deletarTela } from '@/services/cadastros/acessos/telas';
import { FormTela, TelaProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';

const FORM_INICIAL: FormTela = {
  nome: '',
  slug: '',
  id_parent: null,
  ordem: 0,
  ativo: true,
};

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function Telas() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const { can } = usePermission();

  const [rows, setRows] = useState<TelaProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [allTelas, setAllTelas] = useState<TelaProps[]>([]);

  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormTela>(FORM_INICIAL);
  const [parentSelecionado, setParentSelecionado] = useState<TelaProps | null>(null);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadAllTelas() {
      try {
        const response = await getTelas();
        setAllTelas(response.menus ?? []);
      } catch (err) {
        console.error(err);
      }
    }
    loadAllTelas();
  }, [refreshTrigger]);

  useEffect(() => {
    async function fetchTelas() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const response = await getTelas({
          page: page + 1,
          limit: rowsPerPage,
          nome,
          ativo,
        });
        setRows(response.menus ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar telas');
      } finally {
        setLoading(false);
      }
    }
    fetchTelas();
  }, [page, rowsPerPage, nome, statusFiltro, refreshTrigger]);

  const limparFiltros = () => {
    setNomeInput('');
    setStatusFiltro('todos');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setParentSelecionado(null);
    setSlugManuallyEdited(false);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (tela: TelaProps) => {
    setEditingId(tela.id);
    setForm({
      nome: tela.nome,
      slug: tela.slug,
      id_parent: tela.id_parent,
      ordem: tela.ordem,
      ativo: tela.ativo,
    });
    const parent = allTelas.find((t) => t.id === tela.id_parent) ?? null;
    setParentSelecionado(parent);
    setSlugManuallyEdited(true);
    setIsModalOpen(true);
  };

  const salvarTela = async () => {
    if (!form.nome.trim()) {
      notify.error('Nome é obrigatório');
      return;
    }
    if (!form.slug.trim()) {
      notify.error('Slug é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nome: form.nome,
        slug: form.slug,
        id_parent: form.id_parent || null,
        ordem: form.ordem,
        ativo: form.ativo,
      };
      if (editingId) {
        await editarTela(editingId, payload);
        notify.success('Tela atualizada com sucesso');
      } else {
        await criarTela(payload);
        notify.success('Tela cadastrada com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar tela' : 'Erro ao cadastrar tela');
    } finally {
      setSaving(false);
    }
  };

  const excluirTela = async () => {
    if (!editingId) return;
    try {
      await deletarTela(editingId);
      notify.success('Tela excluída com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir tela');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirTela,
    message: 'Tem certeza que deseja excluir a tela? Esta ação não pode ser desfeita.',
    title: 'Excluir Tela',
  });

  const setField = <K extends keyof FormTela>(field: K, value: FormTela[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNomeChange = (value: string) => {
    setField('nome', value);
    if (!slugManuallyEdited) {
      setField('slug', toSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setField('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };
  // função que remove a possibilidade de um "pai" virar "filho" dos próprios filhos:
  const parentOptions = useMemo(() => {
    if (!editingId) return allTelas;
    const excluded = new Set<string>([editingId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of allTelas) {
        if (!excluded.has(t.id) && t.id_parent && excluded.has(t.id_parent)) {
          excluded.add(t.id);
          changed = true;
        }
      }
    }
    return allTelas.filter((t) => !excluded.has(t.id));
  }, [allTelas, editingId]);

  return (
    <>
      <PageHeader title="Telas" subtitle="Gerencie as telas do sistema para montagem dos menus" />
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

        <Card title="Telas Cadastradas" create={can('pode_criar') ? abrirCriacaoModal : undefined}>
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
                    {['Nome', 'Slug', 'Tela Pai', 'Ordem', 'Status'].map((label) => (
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
                      <TableCell>{row.slug}</TableCell>
                      <TableCell>
                        {rows.find((parent) => parent.id === row.id_parent)?.nome ?? '—'}
                      </TableCell>
                      <TableCell>{row.ordem}</TableCell>
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
        title={editingId ? 'Editar Tela' : 'Nova Tela'}
        subtitle={editingId ? form.nome : 'Preencha os dados da nova tela'}
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
              label="Nome"
              required
              value={form.nome}
              onChange={(e) => handleNomeChange(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Slug"
              required
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              helperText="Identificador único para roteamento e permissões"
              slotProps={{ htmlInput: { pattern: '[a-z0-9-]+' } }}
            />
          </div>

          {/* Hierarquia */}
          <p className={styles.sectionTitle}>Hierarquia</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={parentOptions}
              getOptionLabel={(t) => t.nome}
              value={parentSelecionado}
              onChange={(_, v) => {
                setParentSelecionado(v);
                setField('id_parent', v?.id ?? null);
                // ordem do pai ++ ou 0 para raíz:
                setField('ordem', v ? v.ordem + 1 : 0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tela Pai"
                  helperText="Deixe vazio para item raiz do menu"
                />
              )}
            />
          </div>

          {/* Configuração */}
          <p className={styles.sectionTitle}>Configuração</p>
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
              label="Tela Ativa"
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Tela
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarTela}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Tela'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
