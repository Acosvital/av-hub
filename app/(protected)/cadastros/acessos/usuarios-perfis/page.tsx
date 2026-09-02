'use client';

import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { FaPlus } from 'react-icons/fa';
import styles from './styles.module.css';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import MobileCardList from '@/components/Ui/MobileCardList/MobileCardList';
import { notify } from '@/lib/toast/toast';
import { getUsuarios } from '@/services/cadastros/acessos/usuarios';
import { getPerfis } from '@/services/cadastros/acessos/perfis';
import {
  getUsuariosPerfis,
  criarUsuarioPerfil,
  deletarUsuarioPerfil,
} from '@/services/cadastros/acessos/usuariosPerfis';
import { FormUsuarioPerfil, UsuarioPerfilProps } from './types';
import { UsuarioProps } from '../usuarios/types';
import { PerfilProps } from '../perfis/types';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';

const FORM_INICIAL: FormUsuarioPerfil = {
  id_usuario: '',
  id_perfil: '',
};

export default function UsuariosPerfis() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<UsuarioPerfilProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [allUsuarios, setAllUsuarios] = useState<UsuarioProps[]>([]);
  const [allPerfis, setAllPerfis] = useState<PerfilProps[]>([]);

  const [usuarioFiltro, setUsuarioFiltro] = useState<UsuarioProps | null>(null);
  const [perfilFiltro, setPerfilFiltro] = useState<PerfilProps | null>(null);

  const [form, setForm] = useState<FormUsuarioPerfil>(FORM_INICIAL);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioProps | null>(null);
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilProps | null>(null);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [usuariosRes, perfisRes] = await Promise.all([
          getUsuarios({ limit: 1000 }),
          getPerfis({ limit: 1000 }),
        ]);
        setAllUsuarios(usuariosRes.usuarios ?? []);
        setAllPerfis(perfisRes.perfis ?? []);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar dados de referência');
      }
    }
    loadReferenceData();
  }, []);

  useEffect(() => {
    async function fetchVinculos() {
      try {
        setLoading(true);
        const response = await getUsuariosPerfis({
          page: page + 1,
          limit: rowsPerPage,
          id_usuario: usuarioFiltro?.id,
          id_perfil: perfilFiltro?.id,
        });
        setRows(response.data ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar vínculos');
      } finally {
        setLoading(false);
      }
    }
    fetchVinculos();
  }, [page, rowsPerPage, usuarioFiltro, perfilFiltro, refreshTrigger]);

  const abrirCriacaoModal = () => {
    setIsEditing(false);
    setForm(FORM_INICIAL);
    setUsuarioSelecionado(null);
    setPerfilSelecionado(null);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (vinculo: UsuarioPerfilProps) => {
    setIsEditing(true);
    setForm({
      id_usuario: vinculo.id_usuario,
      id_perfil: vinculo.id_perfil,
    });
    setUsuarioSelecionado(allUsuarios.find((u) => u.id === vinculo.id_usuario) ?? null);
    setPerfilSelecionado(allPerfis.find((p) => p.id === vinculo.id_perfil) ?? null);
    setIsModalOpen(true);
  };

  const salvarVinculo = async () => {
    if (!form.id_usuario) {
      notify.error('Usuário é obrigatório');
      return;
    }
    if (!form.id_perfil) {
      notify.error('Perfil é obrigatório');
      return;
    }

    try {
      setSaving(true);
      await criarUsuarioPerfil({
        id_usuario: form.id_usuario,
        id_perfil: form.id_perfil,
      });
      notify.success('Vínculo criado com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao criar vínculo');
    } finally {
      setSaving(false);
    }
  };

  const excluirUsuarioPerfil = async () => {
    try {
      if (!usuarioSelecionado?.id || !perfilSelecionado?.id) return;
      await deletarUsuarioPerfil(usuarioSelecionado.id, perfilSelecionado.id);
      notify.success('Vínculo excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir vínculo');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirUsuarioPerfil,
    message: 'Tem certeza que deseja excluir esse Vínculo? Esta ação não pode ser desfeita.',
    title: 'Excluir Vínculo',
  });

  const setField = <K extends keyof FormUsuarioPerfil>(field: K, value: FormUsuarioPerfil[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getUsuarioNome = (row: UsuarioPerfilProps) =>
    row.usuario_nome ?? allUsuarios.find((u) => u.id === row.id_usuario)?.username ?? '—';

  const getPerfilNome = (row: UsuarioPerfilProps) =>
    row.perfil_nome ?? allPerfis.find((p) => p.id === row.id_perfil)?.nome ?? '—';

  return (
    <>
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader
          title="Usuários × Perfis"
          subtitle="Gerencie os vínculos entre usuários e perfis de acesso"
        />
        {can('pode_criar') && (
          <Button variant="primary" icon={<FaPlus size={14} />} onClick={abrirCriacaoModal}>
            Novo
          </Button>
        )}
      </div>
      <PageContent>
        <div className={styles.tableCard}>
          <div className={styles.filterBar}>
            <Autocomplete
              sx={{ flex: '1 1 240px', minWidth: 240 }}
              options={allUsuarios}
              getOptionKey={(u) => u.id}
              getOptionLabel={(u) => u.username}
              value={usuarioFiltro}
              onChange={(_, v) => {
                setUsuarioFiltro(v);
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Usuário" variant="outlined" />}
            />
            <Autocomplete
              sx={{ flex: '1 1 240px', minWidth: 240 }}
              options={allPerfis}
              getOptionKey={(p) => p.id}
              getOptionLabel={(p) => p.nome}
              value={perfilFiltro}
              onChange={(_, v) => {
                setPerfilFiltro(v);
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Perfil" variant="outlined" />}
            />
          </div>
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
                    {['Usuário', 'Perfil', 'Criado em'].map((label) => (
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
                  {rows.map((row, key) => (
                    <TableRow
                      hover={can('pode_editar')}
                      key={key}
                      onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                      sx={{
                        cursor: can('pode_editar') ? 'pointer' : 'default',
                        '& .MuiTableCell-root': {
                          borderBottom: '1px solid color-mix(in srgb, var(--foreground) 7%, transparent)',
                        },
                      }}
                    >
                      <TableCell>{getUsuarioNome(row)}</TableCell>
                      <TableCell>{getPerfilNome(row)}</TableCell>
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
            </div>
            <MobileCardList
              rows={rows}
              getRowKey={(row) => `${row.id_usuario}-${row.id_perfil}`}
              emptyMessage="Nenhum vínculo encontrado."
              onRowClick={can('pode_editar') ? abrirEdicaoModal : undefined}
              renderTitle={(row) => getUsuarioNome(row)}
              renderSubtitle={(row) => getPerfilNome(row)}
              fields={(row) => [
                {
                  label: 'Criado em',
                  value: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : '—',
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
        title={isEditing ? 'Detalhes do Vínculo' : 'Novo Vínculo'}
        subtitle={
          isEditing
            ? `${usuarioSelecionado?.username} — ${perfilSelecionado?.nome}`
            : 'Associe um perfil de acesso ao usuário'
        }
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <p className={styles.sectionTitle}>Vínculo</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={allUsuarios}
              getOptionKey={(u) => u.id}
              getOptionLabel={(u) => u.username}
              value={usuarioSelecionado}
              onChange={(_, v) => {
                setUsuarioSelecionado(v);
                setField('id_usuario', v?.id ?? '');
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!!isEditing}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Usuário"
                  required
                  helperText={isEditing ? 'Não pode ser alterado após a criação' : ''}
                />
              )}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={allPerfis}
              getOptionKey={(p) => p.id}
              getOptionLabel={(p) => p.nome}
              value={perfilSelecionado}
              onChange={(_, v) => {
                setPerfilSelecionado(v);
                setField('id_perfil', v?.id ?? '');
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!!isEditing}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Perfil"
                  required
                  helperText={isEditing ? 'Não pode ser alterado após a criação' : ''}
                />
              )}
            />
          </div>

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <PermissionButton
              acao={isEditing ? 'pode_deletar' : 'pode_criar'}
              variant={isEditing ? 'danger' : 'primary'}
              onClick={isEditing ? openDeleteDialog : salvarVinculo}
            >
              {saving ? 'Salvando...' : isEditing ? 'Excluir' : 'Novo Vínculo'}
            </PermissionButton>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
