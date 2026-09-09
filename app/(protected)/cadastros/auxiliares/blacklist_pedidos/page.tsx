'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
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
  getBlacklistPedidos,
  criarBlacklistPedido,
  editarBlacklistPedido,
  deletarBlacklistPedido,
} from '@/services/cadastros/auxiliares/blacklistPedidos';
import { getUnidades } from '@/services/cadastros/auxiliares/unidades';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { BlacklistPedidoProps, FormBlacklistPedido } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import dateFormatter from '@/utils/dateFormatter';

const FORM_INICIAL: FormBlacklistPedido = { numero_pedido: '', codigo_empresa: '', motivo: '' };

export default function BlacklistPedidos() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNumero, setEditingNumero] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<BlacklistPedidoProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [numeroInput, setNumeroInput] = useState('');
  const numero = useDebounce(numeroInput, 500);

  const [form, setForm] = useState<FormBlacklistPedido>(FORM_INICIAL);
  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    getUnidades({ limit: 500 })
      .then((res) => setUnidades(res.unidades ?? []))
      .catch(() => notify.error('Erro ao carregar unidades'));
  }, []);

  const unidadeLabel = (id: string) => unidades.find((u) => u.id === id)?.nome_fantasia ?? '—';

  useEffect(() => {
    async function fetchBlacklist() {
      try {
        setLoading(true);
        const response = await getBlacklistPedidos({
          page: page + 1,
          limit: rowsPerPage,
          numero_pedido: numero || undefined,
        });
        setRows(response.blacklist_pedidos ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar blacklist de pedidos');
      } finally {
        setLoading(false);
      }
    }
    fetchBlacklist();
  }, [page, rowsPerPage, numero, refreshTrigger]);

  const abrirCriacaoModal = () => {
    setEditingNumero(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (registro: BlacklistPedidoProps) => {
    setEditingNumero(registro.numero_pedido);
    setForm({
      numero_pedido: registro.numero_pedido,
      codigo_empresa: registro.codigo_empresa,
      motivo: registro.motivo ?? '',
    });
    setIsModalOpen(true);
  };

  const salvar = async () => {
    if (!form.numero_pedido.trim()) {
      notify.error('Número do pedido é obrigatório');
      return;
    }
    if (!editingNumero && !form.codigo_empresa) {
      notify.error('Unidade é obrigatória');
      return;
    }
    try {
      setSaving(true);
      if (editingNumero) {
        await editarBlacklistPedido(editingNumero, { motivo: form.motivo.trim() || undefined });
        notify.success('Blacklist atualizada com sucesso');
      } else {
        await criarBlacklistPedido({
          numero_pedido: form.numero_pedido.trim(),
          codigo_empresa: form.codigo_empresa,
          motivo: form.motivo.trim() || undefined,
        });
        notify.success('Pedido adicionado à blacklist');
      }
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(
        editingNumero
          ? 'Erro ao atualizar blacklist'
          : 'Erro ao adicionar pedido à blacklist (pode já estar cadastrado)'
      );
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    if (!editingNumero) return;
    try {
      await deletarBlacklistPedido(editingNumero);
      notify.success('Pedido removido da blacklist');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao remover pedido da blacklist');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluir,
    message:
      'Tem certeza que deseja remover este pedido da blacklist? Ele volta a aparecer nas views analíticas (resumos de vendas).',
    title: 'Remover da Blacklist',
  });

  const setField = <K extends keyof FormBlacklistPedido>(
    field: K,
    value: FormBlacklistPedido[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className={styles.pageGlow}>
        <div className={styles.pageHeaderRow}>
          <PageHeader
            title="Blacklist de Pedidos"
            subtitle="Pedidos bloqueados nas views analíticas (resumos de vendas)"
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
              searchValue={numeroInput}
              onSearchChange={(value) => {
                setNumeroInput(value);
                setPage(0);
              }}
              searchPlaceholder="Buscar por número do pedido..."
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
                          {['Pedido', 'Unidade', 'Motivo', 'Adicionado em'].map((label) => (
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
                            key={row.numero_pedido}
                            onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                            sx={{
                              cursor: can('pode_editar') ? 'pointer' : 'default',
                              '& .MuiTableCell-root': {
                                borderBottom:
                                  '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                              },
                            }}
                          >
                            <TableCell>{row.numero_pedido}</TableCell>
                            <TableCell>{unidadeLabel(row.codigo_empresa)}</TableCell>
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
                  getRowKey={(row) => row.numero_pedido}
                  emptyMessage="Nenhum pedido na blacklist."
                  onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
                  renderTitle={(row) => row.numero_pedido}
                  renderSubtitle={(row) => unidadeLabel(row.codigo_empresa)}
                  fields={(row) => [
                    { label: 'Motivo', value: row.motivo || 'Sem motivo registrado' },
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
        title={editingNumero ? 'Editar Blacklist' : 'Adicionar à Blacklist'}
        subtitle={editingNumero ?? 'Preencha o número do pedido a bloquear'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Número do Pedido"
              required
              disabled={!!editingNumero}
              value={form.numero_pedido}
              onChange={(e) => setField('numero_pedido', e.target.value)}
              helperText={
                editingNumero
                  ? 'O número não pode ser alterado — remova e adicione de novo se precisar trocar'
                  : 'Ex.: PV-001234'
              }
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 220 }}
              options={unidades}
              getOptionKey={(u) => u.id}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidades.find((u) => u.id === form.codigo_empresa) ?? null}
              onChange={(_, v) => setField('codigo_empresa', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!!editingNumero}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Unidade"
                  required
                  helperText={
                    editingNumero
                      ? undefined
                      : 'numero_pedido não é único entre empresas — precisa saber de qual unidade'
                  }
                />
              )}
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
              editingNumero && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingNumero && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Remover da Blacklist
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingNumero ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvar}
              >
                {saving ? 'Salvando...' : editingNumero ? 'Salvar Alterações' : 'Adicionar'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
