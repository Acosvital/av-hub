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
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
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
import { getCargos, criarCargo, editarCargo, deletarCargo } from '@/services/cadastros/auxiliares/cargos';
import { getUnidades } from '@/services/cadastros/auxiliares/unidades';
import { getSetores } from '@/services/cadastros/auxiliares/setores';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { SetorProps } from '@/app/(protected)/cadastros/auxiliares/setores/types';
import { CargoProps, FormCargo, NIVEIS_HIERARQUICOS } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';

const FORM_INICIAL: FormCargo = {
  codigo_empresa: '',
  id_setor: '',
  nome: '',
  nvl_permissao: '',
  descricao: '',
  ativo: true,
};

export default function Cargos() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<CargoProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);
  const [setores, setSetores] = useState<SetorProps[]>([]);

  // Setores disponíveis pra unidade escolhida no formulário — um cargo só
  // pode pertencer a um setor da mesma empresa a que está vinculado.
  const [setoresDoForm, setSetoresDoForm] = useState<SetorProps[]>([]);

  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const [unidadeFiltro, setUnidadeFiltro] = useState('');
  const [setorFiltro, setSetorFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [form, setForm] = useState<FormCargo>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadReferencias() {
      try {
        const [unidadesRes, setoresRes] = await Promise.all([
          getUnidades({ limit: 500 }),
          getSetores({ limit: 500 }),
        ]);
        setUnidades(unidadesRes.unidades ?? []);
        setSetores(setoresRes.setores ?? []);
      } catch {
        notify.error('Erro ao carregar unidades e setores');
      }
    }
    loadReferencias();
  }, []);

  useEffect(() => {
    async function loadSetoresDoForm() {
      if (!form.codigo_empresa) {
        setSetoresDoForm([]);
        return;
      }
      try {
        const data = await getSetores({ codigo_empresa: form.codigo_empresa, limit: 500 });
        setSetoresDoForm(data.setores ?? []);
      } catch {
        notify.error('Erro ao carregar setores da unidade');
      }
    }
    loadSetoresDoForm();
  }, [form.codigo_empresa]);

  useEffect(() => {
    async function fetchCargos() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const response = await getCargos({
          page: page + 1,
          limit: rowsPerPage,
          nome: nome || undefined,
          codigo_empresa: unidadeFiltro || undefined,
          id_setor: setorFiltro || undefined,
          ativo,
        });
        setRows(response.cargos ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar cargos');
      } finally {
        setLoading(false);
      }
    }
    fetchCargos();
  }, [page, rowsPerPage, nome, unidadeFiltro, setorFiltro, statusFiltro, refreshTrigger]);

  const unidadeLabel = (id: string) => unidades.find((u) => u.id === id)?.nome_fantasia ?? '—';
  const setorLabel = (id: string) => setores.find((s) => s.id === id)?.nome ?? '—';

  const FILTROS_CARGO = [
    {
      key: 'unidade',
      label: 'Unidade',
      options: unidades.map((u) => ({ value: u.id, label: u.nome_fantasia })),
    },
    {
      key: 'setor',
      label: 'Setor',
      options: setores.map((s) => ({ value: s.id, label: s.nome })),
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

  const abrirEdicaoModal = (cargo: CargoProps) => {
    setEditingId(cargo.id);
    setForm({
      codigo_empresa: cargo.codigo_empresa,
      id_setor: cargo.id_setor,
      nome: cargo.nome,
      nvl_permissao: cargo.nvl_permissao,
      descricao: cargo.descricao,
      ativo: cargo.ativo,
    });
    setIsModalOpen(true);
  };

  const salvarCargo = async () => {
    if (!form.codigo_empresa) {
      notify.error('Unidade é obrigatória');
      return;
    }
    if (!form.id_setor) {
      notify.error('Setor é obrigatório');
      return;
    }
    if (!form.nome.trim()) {
      notify.error('Nome do cargo é obrigatório');
      return;
    }
    if (form.nvl_permissao === '') {
      notify.error('Nível hierárquico é obrigatório');
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
        id_setor: form.id_setor,
        nome: form.nome.trim(),
        nvl_permissao: Number(form.nvl_permissao),
        descricao: form.descricao.trim(),
        ativo: form.ativo,
      };

      if (editingId) {
        await editarCargo(editingId, payload);
        notify.success('Cargo atualizado com sucesso');
      } else {
        await criarCargo(payload);
        notify.success('Cargo cadastrado com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar cargo' : 'Erro ao cadastrar cargo');
    } finally {
      setSaving(false);
    }
  };

  const excluirCargo = async () => {
    if (!editingId) return;
    try {
      await deletarCargo(editingId);
      notify.success('Cargo excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir cargo. Verifique se não há funcionários vinculados a ele.');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirCargo,
    message: 'Tem certeza que deseja excluir o cargo? Esta ação não pode ser desfeita.',
    title: 'Excluir Cargo',
  });

  const setField = <K extends keyof FormCargo>(field: K, value: FormCargo[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Cargos" subtitle="Gerencie os cargos cadastrados no sistema" />
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
            filters={FILTROS_CARGO}
            activeValues={{
              unidade: unidadeFiltro || undefined,
              setor: setorFiltro || undefined,
              status: statusFiltro !== 'todos' ? statusFiltro : undefined,
            }}
            onFilterChange={(key, value) => {
              if (key === 'unidade') {
                setUnidadeFiltro(value ?? '');
                setPage(0);
              } else if (key === 'setor') {
                setSetorFiltro(value ?? '');
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
                    {['Nome', 'Unidade', 'Setor', 'Nível Hierárquico', 'Status'].map((label) => (
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
                      <TableCell>{row.nome}</TableCell>
                      <TableCell>{unidadeLabel(row.codigo_empresa)}</TableCell>
                      <TableCell>{setorLabel(row.id_setor)}</TableCell>
                      <TableCell>{NIVEIS_HIERARQUICOS[row.nvl_permissao] ?? row.nvl_permissao}</TableCell>
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
              emptyMessage="Nenhum cargo encontrado."
              onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
              renderTitle={(row) => row.nome}
              renderSubtitle={(row) => unidadeLabel(row.codigo_empresa)}
              renderBadge={(row) => (
                <Chip
                  label={row.ativo ? 'Ativo' : 'Inativo'}
                  color={row.ativo ? 'success' : 'error'}
                  size="small"
                />
              )}
              fields={(row) => [
                { label: 'Setor', value: setorLabel(row.id_setor) },
                {
                  label: 'Nível Hierárquico',
                  value: NIVEIS_HIERARQUICOS[row.nvl_permissao] ?? row.nvl_permissao,
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
        title={editingId ? 'Editar Cargo' : 'Novo Cargo'}
        subtitle={editingId ? form.nome : 'Preencha os dados do novo cargo'}
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
              onChange={(_, v) => {
                setField('codigo_empresa', v?.id ?? '');
                setField('id_setor', '');
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Unidade" required />}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 220 }}
              options={setoresDoForm}
              getOptionKey={(s) => s.id}
              getOptionLabel={(s) => s.nome}
              value={setoresDoForm.find((s) => s.id === form.id_setor) ?? null}
              onChange={(_, v) => setField('id_setor', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!form.codigo_empresa}
              renderInput={(params) => <TextField {...params} label="Setor" required />}
            />
            <FormControl sx={{ minWidth: 220 }} required>
              <InputLabel>Nível Hierárquico</InputLabel>
              <Select
                value={form.nvl_permissao}
                label="Nível Hierárquico"
                onChange={(e) => setField('nvl_permissao', Number(e.target.value))}
              >
                {Object.entries(NIVEIS_HIERARQUICOS).map(([nivel, label]) => (
                  <MenuItem key={nivel} value={Number(nivel)}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome do Cargo"
              required
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              helperText="Ex: Coordenador"
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
              label="Cargo Ativo"
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Cargo
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarCargo}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Cargo'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
