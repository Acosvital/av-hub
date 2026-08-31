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
  InputLabel,
  MenuItem,
  Select,
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
import {
  getUnidades,
  criarUnidade,
  editarUnidade,
  deletarUnidade,
} from '@/services/cadastros/auxiliares/unidades';
import { FormUnidade, TIPOS_UNIDADE, UnidadeProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import PhotoUpload from '@/components/Ui/PhotoUpload/PhotoUpload';
import { UFS } from '@/utils/consts';

const FORM_INICIAL: FormUnidade = {
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  tipo_unidade: 'matriz',
  matriz_id: '',
  foto_url: '',
  nome_contato: '',
  email: '',
  telefone: '',
  celular: '',
  homepage: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  latitude_y: '',
  longitude_x: '',
  ordem_exibicao: '',
};

const tipoLabel = (tipo: string) => TIPOS_UNIDADE.find((t) => t.value === tipo)?.label ?? tipo;

export default function Unidades() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<UnidadeProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [matrizes, setMatrizes] = useState<UnidadeProps[]>([]);

  const [nomeInput, setNomeInput] = useState('');
  const [cnpjInput, setCnpjInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const cnpj = useDebounce(cnpjInput, 500);
  const [tipoFiltro, setTipoFiltro] = useState('');

  const [form, setForm] = useState<FormUnidade>(FORM_INICIAL);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadMatrizes() {
      try {
        const data = await getUnidades({ tipo_unidade: 'matriz', limit: 500 });
        setMatrizes(data.unidades ?? []);
      } catch {
        notify.error('Erro ao carregar unidades matrizes');
      }
    }
    loadMatrizes();
  }, [refreshTrigger]);

  useEffect(() => {
    async function fetchUnidades() {
      try {
        setLoading(true);
        const response = await getUnidades({
          page: page + 1,
          limit: rowsPerPage,
          nome_fantasia: nome || undefined,
          cnpj: cnpj || undefined,
          tipo_unidade: tipoFiltro || undefined,
        });
        setRows(response.unidades ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar unidades');
      } finally {
        setLoading(false);
      }
    }
    fetchUnidades();
  }, [page, rowsPerPage, nome, cnpj, tipoFiltro, refreshTrigger]);

  const matrizLabel = (id: string) => {
    const found = matrizes.find((m) => m.id === id);
    return found ? found.nome_fantasia : '—';
  };

  const limparFiltros = () => {
    setNomeInput('');
    setCnpjInput('');
    setTipoFiltro('');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setFotoPreviewUrl(null);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (unidade: UnidadeProps) => {
    setEditingId(unidade.id);
    setFotoPreviewUrl(unidade.foto_signed_url ?? null);
    setForm({
      cnpj: unidade.cnpj,
      razao_social: unidade.razao_social,
      nome_fantasia: unidade.nome_fantasia,
      tipo_unidade: unidade.tipo_unidade,
      matriz_id: unidade.matriz_id ?? '',
      foto_url: unidade.foto_url ?? '',
      nome_contato: unidade.nome_contato ?? '',
      email: unidade.email ?? '',
      telefone: unidade.telefone ?? '',
      celular: unidade.celular ?? '',
      homepage: unidade.homepage ?? '',
      logradouro: unidade.logradouro ?? '',
      numero: unidade.numero ?? '',
      complemento: unidade.complemento ?? '',
      bairro: unidade.bairro ?? '',
      cidade: unidade.cidade ?? '',
      estado: unidade.estado ?? '',
      cep: unidade.cep ?? '',
      latitude_y: unidade.latitude_y ?? '',
      longitude_x: unidade.longitude_x ?? '',
      ordem_exibicao: unidade.ordem_exibicao != null ? String(unidade.ordem_exibicao) : '',
    });
    setIsModalOpen(true);
  };

  const salvarUnidade = async () => {
    if (!form.cnpj.trim()) {
      notify.error('CNPJ é obrigatório');
      return;
    }
    if (!form.nome_fantasia.trim()) {
      notify.error('Nome fantasia é obrigatório');
      return;
    }
    if (!form.razao_social.trim()) {
      notify.error('Razão social é obrigatória');
      return;
    }
    if (form.tipo_unidade === 'filial' && !form.matriz_id) {
      notify.error('Selecione a matriz da filial');
      return;
    }
    const camposObrigatorios: [keyof FormUnidade, string][] = [
      ['nome_contato', 'Nome do contato é obrigatório'],
      ['email', 'Email é obrigatório'],
      ['telefone', 'Telefone é obrigatório'],
      ['logradouro', 'Logradouro é obrigatório'],
      ['numero', 'Número é obrigatório'],
      ['bairro', 'Bairro é obrigatório'],
      ['cidade', 'Cidade é obrigatória'],
      ['estado', 'UF é obrigatória'],
      ['cep', 'CEP é obrigatório'],
    ];
    for (const [campo, mensagem] of camposObrigatorios) {
      if (!form[campo].trim()) {
        notify.error(mensagem);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        cnpj: form.cnpj.trim(),
        nome_fantasia: form.nome_fantasia.trim(),
        razao_social: form.razao_social.trim(),
        tipo_unidade: form.tipo_unidade,
        matriz_id: form.tipo_unidade === 'filial' ? form.matriz_id || null : null,
        foto_url: form.foto_url || null,
        nome_contato: form.nome_contato.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        celular: form.celular.trim() || null,
        homepage: form.homepage.trim() || null,
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado,
        cep: form.cep.trim(),
        latitude_y: form.latitude_y.trim() || null,
        longitude_x: form.longitude_x.trim() || null,
        ordem_exibicao: form.ordem_exibicao.trim() ? Number(form.ordem_exibicao) : null,
      };

      if (editingId) {
        await editarUnidade(editingId, payload);
        notify.success('Unidade atualizada com sucesso');
      } else {
        await criarUnidade(payload);
        notify.success('Unidade cadastrada com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar unidade' : 'Erro ao cadastrar unidade');
    } finally {
      setSaving(false);
    }
  };

  const excluirUnidade = async () => {
    if (!editingId) return;
    try {
      await deletarUnidade(editingId);
      notify.success('Unidade excluída com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir unidade');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirUnidade,
    message: 'Tem certeza que deseja excluir a unidade? Esta ação não pode ser desfeita.',
    title: 'Excluir Unidade',
  });

  const setField = <K extends keyof FormUnidade>(field: K, value: FormUnidade[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader title="Unidades" subtitle="Gerencie as unidades cadastradas no sistema" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome Fantasia"
              variant="outlined"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="CNPJ"
              variant="outlined"
              value={cnpjInput}
              onChange={(e) => setCnpjInput(e.target.value)}
            />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={tipoFiltro}
                label="Tipo"
                onChange={(e) => {
                  setTipoFiltro(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {TIPOS_UNIDADE.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
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
          title="Unidades Cadastradas"
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
                    {['Nome Fantasia', 'CNPJ', 'Tipo', 'Matriz', 'Cidade/UF', 'Telefone'].map((label) => (
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
                        <div className={styles.avatarCell}>
                          {row.foto_signed_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.foto_signed_url} alt="" className={styles.avatarThumb} />
                          ) : (
                            <div className={styles.avatarThumbPlaceholder} />
                          )}
                          {row.nome_fantasia}
                        </div>
                      </TableCell>
                      <TableCell>{row.cnpj ? row.cnpj : '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={tipoLabel(row.tipo_unidade)}
                          color={row.tipo_unidade === 'matriz' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.matriz_id ? matrizLabel(row.matriz_id) : '—'}</TableCell>
                      <TableCell>{row.cidade ? `${row.cidade}` : '—'}</TableCell>
                      <TableCell>{row.telefone ?? '—'}</TableCell>
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
        title={editingId ? 'Editar Unidade' : 'Nova Unidade'}
        subtitle={editingId ? form.nome_fantasia : 'Preencha os dados da nova unidade'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          {/* Identificação */}
          <p className={styles.sectionTitle}>Identificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <PhotoUpload
              label="Foto/Logo"
              bucket="empresa"
              shape="rounded"
              previewUrl={fotoPreviewUrl}
              onChange={(key, url) => {
                setField('foto_url', key);
                setFotoPreviewUrl(url);
              }}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="CNPJ"
              required
              value={form.cnpj}
              onChange={(e) => setField('cnpj', e.target.value)}
              helperText="Ex: 12.345.678/0001-99"
            />
            <FormControl sx={{ minWidth: 160 }} required>
              <InputLabel>Tipo de Unidade</InputLabel>
              <Select
                value={form.tipo_unidade}
                label="Tipo de Unidade"
                onChange={(e) => setField('tipo_unidade', e.target.value)}
              >
                {TIPOS_UNIDADE.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {form.tipo_unidade === 'filial' && (
              <Autocomplete
                sx={{ flex: 1, minWidth: 220 }}
                options={matrizes.filter((m) => m.id !== editingId)}
                getOptionLabel={(m) => m.nome_fantasia}
                value={matrizes.find((m) => m.id === form.matriz_id) ?? null}
                onChange={(_, v) => setField('matriz_id', v?.id ?? '')}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => <TextField {...params} label="Matriz" required />}
              />
            )}
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome Fantasia"
              required
              value={form.nome_fantasia}
              onChange={(e) => setField('nome_fantasia', e.target.value)}
              helperText="Ex: Aços Vital Matriz"
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Razão Social"
              required
              value={form.razao_social}
              onChange={(e) => setField('razao_social', e.target.value)}
              helperText="Ex: Aços Vital Ltda"
            />
            <TextField
              sx={{ minWidth: 140 }}
              label="Ordem de Exibição"
              type="number"
              value={form.ordem_exibicao}
              onChange={(e) => setField('ordem_exibicao', e.target.value)}
              helperText="Opcional"
            />
          </div>

          {/* Contato */}
          <p className={styles.sectionTitle}>Contato</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Nome do Contato"
              required
              value={form.nome_contato}
              onChange={(e) => setField('nome_contato', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Telefone"
              required
              value={form.telefone}
              onChange={(e) => setField('telefone', e.target.value)}
              helperText="Ex: (11) 3333-4444"
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Celular"
              value={form.celular}
              onChange={(e) => setField('celular', e.target.value)}
              helperText="Ex: (11) 99999-8888"
            />
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Homepage"
              value={form.homepage}
              onChange={(e) => setField('homepage', e.target.value)}
              helperText="Opcional"
            />
          </div>

          {/* Endereço */}
          <p className={styles.sectionTitle}>Endereço</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ minWidth: 140 }}
              label="CEP"
              required
              value={form.cep}
              onChange={(e) => setField('cep', e.target.value)}
              helperText="Ex: 01310-100"
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Logradouro"
              required
              value={form.logradouro}
              onChange={(e) => setField('logradouro', e.target.value)}
            />
            <TextField
              sx={{ minWidth: 100 }}
              label="Número"
              required
              value={form.numero}
              onChange={(e) => setField('numero', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Complemento"
              value={form.complemento}
              onChange={(e) => setField('complemento', e.target.value)}
              helperText="Opcional"
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Bairro"
              required
              value={form.bairro}
              onChange={(e) => setField('bairro', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Cidade"
              required
              value={form.cidade}
              onChange={(e) => setField('cidade', e.target.value)}
            />
            <FormControl sx={{ minWidth: 120 }} required>
              <InputLabel>UF</InputLabel>
              <Select
                value={form.estado}
                label="UF"
                onChange={(e) => setField('estado', e.target.value)}
              >
                {UFS.map((uf) => (
                  <MenuItem key={uf} value={uf}>
                    {uf}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Geolocalização */}
          <p className={styles.sectionTitle}>Geolocalização</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Latitude"
              value={form.latitude_y}
              onChange={(e) => setField('latitude_y', e.target.value)}
              helperText="Opcional — ex: -23.5505"
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Longitude"
              value={form.longitude_x}
              onChange={(e) => setField('longitude_x', e.target.value)}
              helperText="Opcional — ex: -46.6333"
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Unidade
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarUnidade}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Unidade'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
