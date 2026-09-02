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
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
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
import { getMetasMensais, salvarMeta, deletarMeta } from '@/services/cadastros/auxiliares/metasMensais';
import { FormMeta, MESES, MetaMensalProps, TIPOS_META } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import toBRL from '@/utils/toBRL';

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: 6 }, (_, i) => ANO_ATUAL - 3 + i);

const FORM_INICIAL: FormMeta = {
  ano: ANO_ATUAL,
  mes: new Date().getMonth() + 1,
  tipo: 'venda',
  meta: '',
};

const chaveMeta = (m: { ano: number; mes: number; tipo: string }) => `${m.ano}-${m.mes}-${m.tipo}`;

export default function MetasMensais() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<MetaMensalProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [anoInput, setAnoInput] = useState('');
  const anoBusca = useDebounce(anoInput, 500);
  const [tipoFiltro, setTipoFiltro] = useState<'venda' | 'faturamento' | ''>('');

  const [form, setForm] = useState<FormMeta>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function fetchMetas() {
      try {
        setLoading(true);
        const ano = anoBusca.trim() ? Number(anoBusca) : undefined;
        const response = await getMetasMensais({
          page: page + 1,
          limit: rowsPerPage,
          ano: ano && !Number.isNaN(ano) ? ano : undefined,
          tipo: tipoFiltro || undefined,
        });
        setRows(response.metas_mensais ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar metas mensais');
      } finally {
        setLoading(false);
      }
    }
    fetchMetas();
  }, [page, rowsPerPage, anoBusca, tipoFiltro, refreshTrigger]);

  const FILTROS_META = [
    {
      key: 'tipo',
      label: 'Tipo',
      options: Object.entries(TIPOS_META).map(([value, label]) => ({ value, label })),
    },
  ];

  const abrirCriacaoModal = () => {
    setEditingKey(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (row: MetaMensalProps) => {
    setEditingKey(chaveMeta(row));
    setForm({ ano: row.ano, mes: row.mes, tipo: row.tipo, meta: String(row.meta) });
    setIsModalOpen(true);
  };

  const salvar = async () => {
    if (form.ano === '' || form.mes === '') {
      notify.error('Ano e mês são obrigatórios');
      return;
    }
    const metaValor = Number(form.meta);
    if (!form.meta || Number.isNaN(metaValor) || metaValor <= 0) {
      notify.error('Informe um valor de meta válido');
      return;
    }

    try {
      setSaving(true);
      await salvarMeta({ ano: form.ano, mes: form.mes, tipo: form.tipo, meta: metaValor });
      notify.success(editingKey ? 'Meta atualizada com sucesso' : 'Meta cadastrada com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingKey ? 'Erro ao atualizar meta' : 'Erro ao cadastrar meta');
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    if (form.ano === '' || form.mes === '') return;
    try {
      await deletarMeta(form.ano, form.mes, form.tipo);
      notify.success('Meta excluída com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir meta');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluir,
    message: 'Tem certeza que deseja excluir essa meta? Esta ação não pode ser desfeita.',
    title: 'Excluir Meta',
  });

  const setField = <K extends keyof FormMeta>(field: K, value: FormMeta[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Metas Mensais" subtitle="Gerencie as metas de vendas e faturamento por mês" />
        {can('pode_criar') && (
          <Button variant="primary" icon={<FaPlus size={14} />} onClick={abrirCriacaoModal}>
            Novo
          </Button>
        )}
      </div>
      <PageContent>
        <div className={styles.tableCard}>
          <SearchFilterBar
            searchValue={anoInput}
            onSearchChange={(value) => {
              setAnoInput(value.replace(/\D/g, '').slice(0, 4));
              setPage(0);
            }}
            searchPlaceholder="Buscar por ano..."
            filters={FILTROS_META}
            activeValues={{ tipo: tipoFiltro || undefined }}
            onFilterChange={(key, value) => {
              if (key === 'tipo') {
                setTipoFiltro((value as 'venda' | 'faturamento' | null) ?? '');
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
                    {['Ano', 'Mês', 'Tipo', 'Meta'].map((label) => (
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
                      key={chaveMeta(row)}
                      onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                      sx={{
                        cursor: can('pode_editar') ? 'pointer' : 'default',
                        '& .MuiTableCell-root': {
                          borderBottom: '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                        },
                      }}
                    >
                      <TableCell>{row.ano}</TableCell>
                      <TableCell>{MESES[row.mes] ?? row.mes}</TableCell>
                      <TableCell>
                        <Chip
                          label={TIPOS_META[row.tipo]}
                          color={row.tipo === 'venda' ? 'success' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{toBRL(row.meta)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </div>
            <MobileCardList
              rows={rows}
              getRowKey={chaveMeta}
              emptyMessage="Nenhuma meta encontrada."
              onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
              renderTitle={(row) => `${MESES[row.mes] ?? row.mes} / ${row.ano}`}
              renderSubtitle={() => null}
              renderBadge={(row) => (
                <Chip
                  label={TIPOS_META[row.tipo]}
                  color={row.tipo === 'venda' ? 'success' : 'info'}
                  size="small"
                />
              )}
              fields={(row) => [{ label: 'Meta', value: toBRL(row.meta) }]}
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
        title={editingKey ? 'Editar Meta' : 'Nova Meta'}
        subtitle={
          editingKey
            ? `${MESES[form.mes as number]} / ${form.ano} — ${TIPOS_META[form.tipo]}`
            : 'Preencha os dados da nova meta'
        }
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <p className={styles.sectionTitle}>Período</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControl sx={{ minWidth: 140 }} required disabled={!!editingKey}>
              <InputLabel>Ano</InputLabel>
              <Select
                value={form.ano}
                label="Ano"
                onChange={(e) => setField('ano', Number(e.target.value))}
              >
                {ANOS.map((ano) => (
                  <MenuItem key={ano} value={ano}>
                    {ano}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }} required disabled={!!editingKey}>
              <InputLabel>Mês</InputLabel>
              <Select
                value={form.mes}
                label="Mês"
                onChange={(e) => setField('mes', Number(e.target.value))}
              >
                {Object.entries(MESES).map(([mes, label]) => (
                  <MenuItem key={mes} value={Number(mes)}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }} required disabled={!!editingKey}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={form.tipo}
                label="Tipo"
                onChange={(e) => setField('tipo', e.target.value as 'venda' | 'faturamento')}
              >
                {Object.entries(TIPOS_META).map(([tipo, label]) => (
                  <MenuItem key={tipo} value={tipo}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <p className={styles.sectionTitle}>Valor</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Meta"
              required
              type="number"
              value={form.meta}
              onChange={(e) => setField('meta', e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
              helperText="Ex: 29000000.00"
            />
          </div>

          <div
            className={
              editingKey && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingKey && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Meta
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingKey ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvar}
              >
                {saving ? 'Salvando...' : editingKey ? 'Salvar Alterações' : 'Cadastrar Meta'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
