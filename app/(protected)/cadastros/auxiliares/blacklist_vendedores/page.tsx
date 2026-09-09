'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import { CircularProgress, TextField } from '@mui/material';
import { FaPlus } from 'react-icons/fa';
// Mesmo visual dos outros cadastros auxiliares (Cargos/Setores/Produtos) —
// CSS module reaproveitado em vez de duplicado.
import styles from '@/app/(protected)/cadastros/auxiliares/setores/styles.module.css';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import {
  getBlacklistVendedores,
  criarBlacklistVendedor,
  editarBlacklistVendedor,
  deletarBlacklistVendedor,
} from '@/services/cadastros/auxiliares/blacklistVendedores';
import { BlacklistVendedorProps, FormBlacklistVendedor } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import dateFormatter from '@/utils/dateFormatter';

const FORM_INICIAL: FormBlacklistVendedor = { nome_vendedor: '', motivo: '' };

export default function BlacklistVendedores() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNome, setEditingNome] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<BlacklistVendedorProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);

  const [form, setForm] = useState<FormBlacklistVendedor>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function fetchBlacklist() {
      try {
        setLoading(true);
        const response = await getBlacklistVendedores({
          page: page + 1,
          limit: rowsPerPage,
          nome_vendedor: nome || undefined,
        });
        setRows(response.blacklist_vendedores ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar blacklist de vendedores');
      } finally {
        setLoading(false);
      }
    }
    fetchBlacklist();
  }, [page, rowsPerPage, nome, refreshTrigger]);

  const abrirCriacaoModal = () => {
    setEditingNome(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (registro: BlacklistVendedorProps) => {
    setEditingNome(registro.nome_vendedor);
    setForm({ nome_vendedor: registro.nome_vendedor, motivo: registro.motivo ?? '' });
    setIsModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome_vendedor.trim()) {
      notify.error('Nome do vendedor é obrigatório');
      return;
    }
    try {
      setSaving(true);
      if (editingNome) {
        await editarBlacklistVendedor(editingNome, { motivo: form.motivo.trim() || undefined });
        notify.success('Blacklist atualizada com sucesso');
      } else {
        await criarBlacklistVendedor({
          nome_vendedor: form.nome_vendedor.trim(),
          motivo: form.motivo.trim() || undefined,
        });
        notify.success('Vendedor adicionado à blacklist');
      }
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(
        editingNome
          ? 'Erro ao atualizar blacklist'
          : 'Erro ao adicionar vendedor à blacklist (pode já estar cadastrado)'
      );
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    if (!editingNome) return;
    try {
      await deletarBlacklistVendedor(editingNome);
      notify.success('Vendedor removido da blacklist');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao remover vendedor da blacklist');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluir,
    message:
      'Tem certeza que deseja remover este vendedor da blacklist? Ele volta a aparecer nas views analíticas (rankings, dashboards, resumos).',
    title: 'Remover da Blacklist',
  });

  const setField = <K extends keyof FormBlacklistVendedor>(
    field: K,
    value: FormBlacklistVendedor[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className={styles.pageGlow}>
        <div className={styles.pageHeaderRow}>
          <PageHeader
            title="Blacklist de Vendedores"
            subtitle="Vendedores bloqueados nas views analíticas (rankings, dashboards, resumos de vendas/faturamento)"
          />
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
              searchPlaceholder="Buscar por nome do vendedor..."
              filters={[]}
              activeValues={{}}
              onFilterChange={() => {}}
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
                  <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          {['Vendedor', 'Motivo', 'Adicionado em'].map((label) => (
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
                            key={row.nome_vendedor}
                            onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                            sx={{
                              cursor: can('pode_editar') ? 'pointer' : 'default',
                              '& .MuiTableCell-root': {
                                borderBottom:
                                  '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                              },
                            }}
                          >
                            <TableCell>{row.nome_vendedor}</TableCell>
                            <TableCell>{row.motivo || '—'}</TableCell>
                            <TableCell>
                              {row.created_at ? dateFormatter(row.created_at) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
                <MobileCardList
                  rows={rows}
                  getRowKey={(row) => row.nome_vendedor}
                  emptyMessage="Nenhum vendedor na blacklist."
                  onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
                  renderTitle={(row) => row.nome_vendedor}
                  renderSubtitle={(row) => row.motivo || 'Sem motivo registrado'}
                  fields={(row) => [
                    { label: 'Adicionado em', value: row.created_at ? dateFormatter(row.created_at) : '—' },
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
        title={editingNome ? 'Editar Blacklist' : 'Adicionar à Blacklist'}
        subtitle={editingNome ?? 'Preencha o nome do vendedor a bloquear'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome do Vendedor"
              required
              disabled={!!editingNome}
              value={form.nome_vendedor}
              onChange={(e) => setField('nome_vendedor', e.target.value)}
              helperText={
                editingNome
                  ? 'O nome não pode ser alterado — remova e adicione de novo se precisar trocar'
                  : 'Comparação parcial, sem acento — não precisa ser o nome exato/completo'
              }
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1 }}
              label="Motivo"
              multiline
              minRows={2}
              value={form.motivo}
              onChange={(e) => setField('motivo', e.target.value)}
            />
          </div>

          <div
            className={
              editingNome && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingNome && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Remover da Blacklist
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingNome ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvar}
              >
                {saving ? 'Salvando...' : editingNome ? 'Salvar Alterações' : 'Adicionar'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
