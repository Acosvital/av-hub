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
  FormControlLabel,
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
import { getPerfis } from '@/services/perfis';
import { getTelas } from '@/services/telas';
import { getPermissoes, criarPermissao, editarPermissao } from '@/services/permissoes';
import { FormPermissao, PermissaoProps } from './types';

interface PerfilRef { id: string; nome: string; }
interface TelaRef { id: string; id_parent: 'string' | null; nome: string; }

const FORM_INICIAL: FormPermissao = {
  id_perfil: '',
  id_tela: '',
  pode_visualizar: false,
  pode_criar: false,
  pode_editar: false,
  pode_deletar: false,
};

export default function Permissoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [rows, setRows] = useState<PermissaoProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [allPerfis, setAllPerfis] = useState<PerfilRef[]>([]);
  const [allTelas, setAllTelas] = useState<TelaRef[]>([]);

  const [perfilFiltro, setPerfilFiltro] = useState<PerfilRef | null>(null);
  const [telaFiltro, setTelaFiltro] = useState<TelaRef | null>(null);

  const [form, setForm] = useState<FormPermissao>(FORM_INICIAL);
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilRef | null>(null);
  const [telaSelecionada, setTelaSelecionada] = useState<TelaRef | null>(null);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [perfisRes, telasRes] = await Promise.all([
          getPerfis({ limit: 1000 }),
          getTelas({ limit: 1000 }),
        ]);
        setAllPerfis(perfisRes.perfis ?? []);
        setAllTelas(telasRes.menus ?? []);
      } catch (err) {
        console.error(err);
      }
    }
    loadReferenceData();
  }, []);

  useEffect(() => {
    async function fetchPermissoes() {
      try {
        setLoading(true);
        const response = await getPermissoes({
          page: page + 1,
          limit: rowsPerPage,
          id_perfil: perfilFiltro?.id,
          id_tela: telaFiltro?.id,
        });
        setRows(response.permissoes ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar permissões');
      } finally {
        setLoading(false);
      }
    }
    fetchPermissoes();
  }, [page, rowsPerPage, perfilFiltro, telaFiltro, refreshTrigger]);

  const limparFiltros = () => {
    setPerfilFiltro(null);
    setTelaFiltro(null);
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setPerfilSelecionado(null);
    setTelaSelecionada(null);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (permissao: PermissaoProps) => {
    setEditingId(permissao.id);
    setForm({
      id_perfil: permissao.id_perfil,
      id_tela: permissao.id_tela,
      pode_visualizar: permissao.pode_visualizar,
      pode_criar: permissao.pode_criar,
      pode_editar: permissao.pode_editar,
      pode_deletar: permissao.pode_deletar,
    });
    setPerfilSelecionado(allPerfis.find((p) => p.id === permissao.id_perfil) ?? null);
    setTelaSelecionada(allTelas.find((t) => t.id === permissao.id_tela) ?? null);
    setIsModalOpen(true);
  };

  const salvarPermissao = async () => {
    if (!form.id_perfil) {
      notify.error('Perfil é obrigatório');
      return;
    }
    if (!form.id_tela) {
      notify.error('Tela é obrigatória');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id_perfil: form.id_perfil,
        id_tela: form.id_tela,
        pode_visualizar: form.pode_visualizar,
        pode_criar: form.pode_criar,
        pode_editar: form.pode_editar,
        pode_deletar: form.pode_deletar,
      };

      if (editingId) {
        await editarPermissao(editingId, payload);
        notify.success('Permissão atualizada com sucesso');
      } else {
        await criarPermissao(payload);
        notify.success('Permissão cadastrada com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar permissão' : 'Erro ao cadastrar permissão');
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof FormPermissao>(field: K, value: FormPermissao[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getPerfilNome = (row: PermissaoProps) =>
    row.perfil_nome ?? allPerfis.find((p) => p.id === row.id_perfil)?.nome ?? '—';

  const getTelaNome = (row: PermissaoProps) =>
    row.tela_nome ?? allTelas.find((t) => t.id === row.id_tela)?.nome ?? '—';

  return (
    <>
      <PageHeader
        title='Permissões'
        subtitle='Gerencie as permissões de acesso dos perfis às telas do sistema'
      />
      <PageContent>
        <Card title='Filtros' height='fit'>
          <div className={styles.inputContainers}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={allPerfis}
              getOptionLabel={(p) => p.nome}
              value={perfilFiltro}
              onChange={(_, v) => {
                setPerfilFiltro(v);
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField {...params} label='Perfil' variant='outlined' />
              )}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={allTelas}
              getOptionLabel={(t) => t.nome}
              value={telaFiltro}
              onChange={(_, v) => {
                setTelaFiltro(v);
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField {...params} label='Tela' variant='outlined' />
              )}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button variant='secondary' onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card title='Permissões Cadastradas' create={abrirCriacaoModal}>
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ maxHeight: 420, overflowX: 'auto' }}>
              <Table stickyHeader size='small'>
                <TableHead>
                  <TableRow>
                    {['Perfil', 'Tela', 'Visualizar', 'Criar', 'Editar', 'Deletar'].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      hover
                      key={row.id}
                      onClick={() => abrirEdicaoModal(row)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{getPerfilNome(row)}</TableCell>
                      <TableCell>{getTelaNome(row)}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.pode_visualizar ? 'Sim' : 'Não'}
                          color={row.pode_visualizar ? 'success' : 'error'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.pode_criar ? 'Sim' : 'Não'}
                          color={row.pode_criar ? 'success' : 'error'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.pode_editar ? 'Sim' : 'Não'}
                          color={row.pode_editar ? 'success' : 'error'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.pode_deletar ? 'Sim' : 'Não'}
                          color={row.pode_deletar ? 'success' : 'error'}
                          size='small'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component='div'
            count={rowCount}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage='Resultados por página'
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Card>
      </PageContent>

      <Modal
        title={editingId ? 'Editar Permissão' : 'Nova Permissão'}
        subtitle={
          editingId && perfilSelecionado && telaSelecionada
            ? `${perfilSelecionado.nome} — ${telaSelecionada.nome}`
            : 'Preencha os dados da nova permissão'
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
              options={allPerfis}
              getOptionLabel={(p) => p.nome}
              value={perfilSelecionado}
              onChange={(_, v) => {
                setPerfilSelecionado(v);
                setField('id_perfil', v?.id ?? '');
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!!editingId}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Perfil'
                  required
                  helperText={editingId ? 'Não pode ser alterado após a criação' : ''}
                />
              )}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 260 }}
              options={allTelas}
              getOptionLabel={(t) => t.nome}
              value={telaSelecionada}
              onChange={(_, v) => {
                setTelaSelecionada(v);
                setField('id_tela', v?.id ?? '');
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!!editingId}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Tela'
                  required
                  helperText={editingId ? 'Não pode ser alterada após a criação' : ''}
                />
              )}
            />
          </div>

          <p className={styles.sectionTitle}>Permissões</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.pode_visualizar}
                  onChange={(e) => setField('pode_visualizar', e.target.checked)}
                  color='warning'
                />
              }
              label='Pode Visualizar'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.pode_criar}
                  onChange={(e) => setField('pode_criar', e.target.checked)}
                  color='warning'
                />
              }
              label='Pode Criar'
            />
          </div>
          <div className={styles.formRow}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.pode_editar}
                  onChange={(e) => setField('pode_editar', e.target.checked)}
                  color='warning'
                />
              }
              label='Pode Editar'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.pode_deletar}
                  onChange={(e) => setField('pode_deletar', e.target.checked)}
                  color='warning'
                />
              }
              label='Pode Deletar'
            />
          </div>

          <div className={styles.formActions}>
            <Button variant='secondary' onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant='primary' onClick={salvarPermissao}>
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Permissão'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
