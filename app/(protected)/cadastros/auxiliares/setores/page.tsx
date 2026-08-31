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
import { getSetores, criarSetor, editarSetor, deletarSetor } from '@/services/cadastros/auxiliares/setores';
import { getUnidades } from '@/services/cadastros/auxiliares/unidades';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { FormSetor, SetorProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import normalizeText from '@/utils/normalizeText';

// Setores de topo (Diretoria/Gerência Geral) não devem ser escolhidos como pai de
// subsetor — servem só para agrupar a hierarquia no topo de cada unidade.
const NOMES_SETOR_PAI_BLOQUEADOS = ['gerencia geral', 'diretoria'].map(normalizeText);

const podeSerSetorPai = (setor: SetorProps) => !NOMES_SETOR_PAI_BLOQUEADOS.includes(normalizeText(setor.nome));

const FORM_INICIAL: FormSetor = {
  codigo_empresa: '',
  codigo_setor: '',
  nome: '',
  descricao: '',
  ativo: true,
  parent_id: '',
  sigla: '',
  cor_setor: '#64748b',
};

export default function Setores() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<SetorProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);
  const [setoresDaUnidade, setSetoresDaUnidade] = useState<SetorProps[]>([]);

  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const [unidadeFiltro, setUnidadeFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormSetor>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadUnidades() {
      try {
        const data = await getUnidades({ limit: 500 });
        setUnidades(data.unidades ?? []);
      } catch {
        notify.error('Erro ao carregar unidades');
      }
    }
    loadUnidades();
  }, []);

  // Opções de "Setor Pai" ficam restritas à unidade selecionada no formulário,
  // já que a hierarquia de setores não faz sentido entre empresas diferentes.
  useEffect(() => {
    async function loadSetoresDaUnidade() {
      if (!form.codigo_empresa) {
        setSetoresDaUnidade([]);
        return;
      }
      try {
        const data = await getSetores({ codigo_empresa: form.codigo_empresa, limit: 500 });
        setSetoresDaUnidade(data.setores ?? []);
      } catch {
        notify.error('Erro ao carregar setores da unidade');
      }
    }
    loadSetoresDaUnidade();
  }, [form.codigo_empresa, refreshTrigger]);

  useEffect(() => {
    async function fetchSetores() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const response = await getSetores({
          page: page + 1,
          limit: rowsPerPage,
          nome: nome || undefined,
          codigo_empresa: unidadeFiltro || undefined,
          ativo,
        });
        setRows(response.setores ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar setores');
      } finally {
        setLoading(false);
      }
    }
    fetchSetores();
  }, [page, rowsPerPage, nome, unidadeFiltro, statusFiltro, refreshTrigger]);

  const unidadeLabel = (id: string) => unidades.find((u) => u.id === id)?.nome_fantasia ?? '—';
  const setorPaiLabel = (id: string | null) =>
    id ? (setoresDaUnidade.find((s) => s.id === id)?.nome ?? rows.find((s) => s.id === id)?.nome ?? '—') : '—';

  const limparFiltros = () => {
    setNomeInput('');
    setUnidadeFiltro('');
    setStatusFiltro('todos');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (setor: SetorProps) => {
    setEditingId(setor.id);
    setForm({
      codigo_empresa: setor.codigo_empresa,
      codigo_setor: setor.codigo_setor ?? '',
      nome: setor.nome,
      descricao: setor.descricao,
      ativo: setor.ativo,
      parent_id: setor.parent_id ?? '',
      sigla: setor.sigla ?? '',
      cor_setor: setor.cor_setor ?? '#64748b',
    });
    setIsModalOpen(true);
  };

  const salvarSetor = async () => {
    if (!form.codigo_empresa) {
      notify.error('Unidade é obrigatória');
      return;
    }
    if (!form.nome.trim()) {
      notify.error('Nome do setor é obrigatório');
      return;
    }
    if (!form.descricao.trim()) {
      notify.error('Descrição é obrigatória');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        codigo_empresa: form.codigo_empresa,
        codigo_setor: form.codigo_setor.trim() || null,
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        ativo: form.ativo,
        parent_id: form.parent_id || null,
        sigla: form.sigla.trim() || null,
        cor_setor: form.cor_setor || null,
      };

      if (editingId) {
        await editarSetor(editingId, payload);
        notify.success('Setor atualizado com sucesso');
      } else {
        await criarSetor(payload);
        notify.success('Setor cadastrado com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar setor' : 'Erro ao cadastrar setor');
    } finally {
      setSaving(false);
    }
  };

  const excluirSetor = async () => {
    if (!editingId) return;
    try {
      await deletarSetor(editingId);
      notify.success('Setor excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir setor. Verifique se não há funcionários ou sub-setores vinculados a ele.');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirSetor,
    message: 'Tem certeza que deseja excluir o setor? Esta ação não pode ser desfeita.',
    title: 'Excluir Setor',
  });

  const setField = <K extends keyof FormSetor>(field: K, value: FormSetor[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader title="Setores" subtitle="Gerencie os setores cadastrados no sistema" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome"
              variant="outlined"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
            <Autocomplete
              sx={{ minWidth: 220 }}
              options={unidades}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidades.find((u) => u.id === unidadeFiltro) ?? null}
              onChange={(_, v) => {
                setUnidadeFiltro(v?.id ?? '');
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Unidade" />}
            />
            <FormControl sx={{ minWidth: 160 }}>
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
          title="Setores Cadastrados"
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
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {['Nome', 'Unidade', 'Setor Pai', 'Sigla', 'Status'].map((label) => (
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
                      <TableCell>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: row.cor_setor ?? 'var(--border-strong)',
                            marginRight: 8,
                          }}
                        />
                        {row.nome}
                      </TableCell>
                      <TableCell>{unidadeLabel(row.codigo_empresa)}</TableCell>
                      <TableCell>{setorPaiLabel(row.parent_id)}</TableCell>
                      <TableCell>{row.sigla ?? '—'}</TableCell>
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
        title={editingId ? 'Editar Setor' : 'Novo Setor'}
        subtitle={editingId ? form.nome : 'Preencha os dados do novo setor'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <p className={styles.sectionTitle}>Identificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 220 }}
              options={unidades}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidades.find((u) => u.id === form.codigo_empresa) ?? null}
              onChange={(_, v) => setField('codigo_empresa', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Unidade" required />}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 220 }}
              options={setoresDaUnidade.filter((s) => s.id !== editingId && podeSerSetorPai(s))}
              getOptionLabel={(s) => s.nome}
              value={setoresDaUnidade.find((s) => s.id === form.parent_id) ?? null}
              onChange={(_, v) => setField('parent_id', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!form.codigo_empresa}
              renderInput={(params) => (
                <TextField {...params} label="Setor Pai" placeholder="Nenhum (setor raiz)" />
              )}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome do Setor"
              required
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              helperText="Ex: Comercial"
            />
            <TextField
              sx={{ minWidth: 140 }}
              label="Sigla"
              value={form.sigla}
              onChange={(e) => setField('sigla', e.target.value.toUpperCase())}
              helperText="Opcional — ex: COMU"
              slotProps={{ htmlInput: { maxLength: 10 } }}
            />
            <TextField
              sx={{ minWidth: 140 }}
              label="Código do Setor"
              value={form.codigo_setor}
              onChange={(e) => setField('codigo_setor', e.target.value)}
              helperText="Opcional"
            />
            <TextField
              sx={{ minWidth: 100 }}
              label="Cor"
              type="color"
              value={form.cor_setor}
              onChange={(e) => setField('cor_setor', e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1 }}
              label="Descrição"
              required
              multiline
              minRows={2}
              value={form.descricao}
              onChange={(e) => setField('descricao', e.target.value)}
            />
          </div>

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
              label="Setor Ativo"
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Setor
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarSetor}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Setor'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
