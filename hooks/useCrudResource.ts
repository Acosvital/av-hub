'use client';

import { useEffect, useState } from 'react';
import { notify } from '@/lib/toast/toast';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';

export interface CrudMessages {
  fetchError: string;
  createSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
  createError: string;
  updateError: string;
  deleteError: string;
  deleteMessage: string;
  deleteTitle?: string;
}

interface UseCrudResourceConfig<TRow, TForm, TFilters extends object> {
  initialForm: TForm;
  filters: TFilters;
  list: (
    params: { page: number; limit: number } & TFilters
  ) => Promise<{ rows: TRow[]; total: number }>;
  create: (payload: object) => Promise<unknown>;
  update: (id: string, payload: object) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  getId: (row: TRow) => string;
  toForm: (row: TRow) => TForm;
  toPayload: (form: TForm) => object | null;
  messages: CrudMessages;
}

// Encapsula o esqueleto repetido nas páginas de cadastro (listagem paginada,
// modal de criação/edição e exclusão) — validação e payload ficam a cargo de cada página.
export function useCrudResource<TRow, TForm, TFilters extends object>({
  initialForm,
  filters,
  list,
  create,
  update,
  remove,
  getId,
  toForm,
  toPayload,
  messages,
}: UseCrudResourceConfig<TRow, TForm, TFilters>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [rows, setRows] = useState<TRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [form, setForm] = useState<TForm>(initialForm);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const response = await list({ page: page + 1, limit: rowsPerPage, ...filters });
        if (!active) return;
        setRows(response.rows);
        setRowCount(response.total);
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError(messages.fetchError);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // filtersKey representa o conteúdo de `filters`; `list`/`filters` são recriados a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, refreshTrigger, filtersKey]);

  const refresh = () => setRefreshTrigger((t) => t + 1);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (row: TRow) => {
    setEditingId(getId(row));
    setForm(toForm(row));
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const setField = <K extends keyof TForm>(field: K, value: TForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    const payload = toPayload(form);
    if (payload === null) return;

    try {
      setSaving(true);
      if (editingId) {
        await update(editingId, payload);
        notify.success(messages.updateSuccess);
      } else {
        await create(payload);
        notify.success(messages.createSuccess);
      }
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      setError(editingId ? messages.updateError : messages.createError);
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    if (!editingId) return;
    try {
      await remove(editingId);
      notify.success(messages.deleteSuccess);
      setIsModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
      setError(messages.deleteError);
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluir,
    message: messages.deleteMessage,
    title: messages.deleteTitle,
  });

  return {
    loading,
    saving,
    rows,
    rowCount,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    isModalOpen,
    editingId,
    form,
    setField,
    openCreateModal,
    openEditModal,
    closeModal,
    save,
    openDeleteDialog,
    deleteDialog,
  };
}
