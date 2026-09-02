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

  const FILTROS_SETOR = [
    {
      key: 'unidade',
      label: 'Unidade',
      options: unidades.map((u) => ({ value: u.id, label: u.nome_fantasia })),
    },
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
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Setores" subtitle="Gerencie os setores cadastrados no sistema" />
        {can('pode_criar') && (
          <Button variant="primary" icon={<FaPlus size={14} />} onClick={abrirCriacaoModal}>
            Novo
          </Button>
        )}
      </div>
      <PageContent>
        <div className={styles.tableCard}>
          <SearchFilterBar
            searchValue={nomeInput}
            onSearchChange={(value) => {
              setNomeInput(value);
              setPage(0);
            }}
            searchPlaceholder="Buscar por nome..."
            filters={FILTROS_SETOR}
            activeValues={{
              unidade: unidadeFiltro || undefined,
              status: statusFiltro !== 'todos' ? statusFiltro : undefined,
            }}
            onFilterChange={(key, value) => {
              if (key === 'unidade') {
                setUnidadeFiltro(value ?? '');
                setPage(0);
              } else if (key === 'status') {
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
                    {['Nome', 'Unidade', 'Setor Pai', 'Sigla', 'Status'].map((label) => (
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
            </div>
            <MobileCardList
              rows={rows}
              getRowKey={(row) => row.id}
              emptyMessage="Nenhum setor encontrado."
              onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
              renderTitle={(row) => (
                <>
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
                </>
              )}
              renderSubtitle={(row) => unidadeLabel(row.codigo_empresa)}
              renderBadge={(row) => (
                <Chip
                  label={row.ativo ? 'Ativo' : 'Inativo'}
                  color={row.ativo ? 'success' : 'error'}
                  size="small"
                />
              )}
              fields={(row) => [
                { label: 'Setor Pai', value: setorPaiLabel(row.parent_id) },
                { label: 'Sigla', value: row.sigla ?? '—' },
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
              getOptionKey={(u) => u.id}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidades.find((u) => u.id === form.codigo_empresa) ?? null}
              onChange={(_, v) => setField('codigo_empresa', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Unidade" required />}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 220 }}
              options={setoresDaUnidade.filter((s) => s.id !== editingId && podeSerSetorPai(s))}
              getOptionKey={(s) => s.id}
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
