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
import { criarParceiro, editarParceiro, deletarParceiro, getParceiros } from '@/services/parceiros';
import { FormParceiro, ParceiroProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import { UFS } from '@/utils/consts';

const FORM_INICIAL: FormParceiro = {
  codigo_parceiro_omie: '',
  nome_fantasia: '',
  razao_social: '',
  cpf_cnpj: '',
  observacao: '',
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
};

export default function Parceiros() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<ParceiroProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [nomeInput, setNomeInput] = useState('');
  const [cpfCnpjInput, setCpfCnpjInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const cpfCnpj = useDebounce(cpfCnpjInput, 500);

  const [form, setForm] = useState<FormParceiro>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function fetchParceiros() {
      try {
        setLoading(true);
        const response = await getParceiros({
          page: page + 1,
          limit: rowsPerPage,
          nome_fantasia: nome || undefined,
          cpf_cnpj: cpfCnpj || undefined,
        });
        setRows(response.parceiros ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar parceiros');
      } finally {
        setLoading(false);
      }
    }
    fetchParceiros();
  }, [page, rowsPerPage, nome, cpfCnpj, refreshTrigger]);

  const limparFiltros = () => {
    setNomeInput('');
    setCpfCnpjInput('');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (parceiro: ParceiroProps) => {
    setEditingId(parceiro.id);
    setForm({
      codigo_parceiro_omie: parceiro.codigo_parceiro_omie,
      nome_fantasia: parceiro.nome_fantasia,
      razao_social: parceiro.razao_social,
      cpf_cnpj: parceiro.cpf_cnpj,
      observacao: parceiro.observacao ?? '',
      email: parceiro.email ?? '',
      telefone: parceiro.telefone ?? '',
      celular: parceiro.celular ?? '',
      homepage: parceiro.homepage ?? '',
      logradouro: parceiro.logradouro ?? '',
      numero: parceiro.numero ?? '',
      complemento: parceiro.complemento ?? '',
      bairro: parceiro.bairro ?? '',
      cidade: parceiro.cidade ?? '',
      estado: parceiro.estado ?? '',
      cep: parceiro.cep ?? '',
      latitude_y: parceiro.latitude_y ?? '',
      longitude_x: parceiro.longitude_x ?? '',
    });
    setIsModalOpen(true);
  };

  const salvarParceiro = async () => {
    if (!form.codigo_parceiro_omie.trim()) {
      notify.error('Código do parceiro é obrigatório');
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
    if (!form.cpf_cnpj.trim()) {
      notify.error('CPF/CNPJ é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        codigo_parceiro_omie: form.codigo_parceiro_omie.trim(),
        nome_fantasia: form.nome_fantasia.trim(),
        razao_social: form.razao_social.trim(),
        cpf_cnpj: form.cpf_cnpj.trim(),
        observacao: form.observacao.trim() || null,
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        celular: form.celular.trim() || null,
        homepage: form.homepage.trim() || null,
        logradouro: form.logradouro.trim() || null,
        numero: form.numero.trim() || null,
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado || null,
        cep: form.cep.trim() || null,
        latitude_y: form.latitude_y.trim() || null,
        longitude_x: form.longitude_x.trim() || null,
      };

      if (editingId) {
        await editarParceiro(editingId, payload);
        notify.success('Parceiro atualizado com sucesso');
      } else {
        await criarParceiro(payload);
        notify.success('Parceiro cadastrado com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar parceiro' : 'Erro ao cadastrar parceiro');
    } finally {
      setSaving(false);
    }
  };

  const excluirParceiro = async () => {
    if (!editingId) return;
    try {
      await deletarParceiro(editingId);
      notify.success('Parceiro excluído com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir parceiro');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirParceiro,
    message: 'Tem certeza que deseja excluir o parceiro? Esta ação não pode ser desfeita.',
    title: 'Excluir Parceiro',
  });

  const setField = <K extends keyof FormParceiro>(field: K, value: FormParceiro[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader title="Parceiros" subtitle="Gerencie os parceiros cadastrados no sistema" />
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
              label="CPF/CNPJ"
              variant="outlined"
              value={cpfCnpjInput}
              onChange={(e) => setCpfCnpjInput(e.target.value)}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button variant="secondary" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card
          title="Parceiros Cadastrados"
          create={can('pode_criar') ? abrirCriacaoModal : undefined}
        >
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ maxHeight: 420, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {['Nome Fantasia', 'CPF/CNPJ', 'Cidade/UF', 'Telefone', 'Email'].map(
                      (label) => (
                        <TableCell key={label}>{label}</TableCell>
                      )
                    )}
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
                      <TableCell>{row.nome_fantasia}</TableCell>
                      <TableCell>{row.cpf_cnpj ? row.cpf_cnpj : '—'}</TableCell>
                      <TableCell>{row.cidade ? `${row.cidade}` : '—'}</TableCell>
                      <TableCell>{row.telefone ?? '—'}</TableCell>
                      <TableCell>{row.email ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
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
        </Card>
      </PageContent>

      <Modal
        title={editingId ? 'Editar Parceiro' : 'Novo Parceiro'}
        subtitle={editingId ? form.nome_fantasia : 'Preencha os dados do novo parceiro'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          {/* Identificação */}
          <p className={styles.sectionTitle}>Identificação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Código Omie"
              required
              value={form.codigo_parceiro_omie}
              onChange={(e) => setField('codigo_parceiro_omie', e.target.value)}
              helperText="Ex: 0000012345"
              slotProps={{ htmlInput: { maxLength: 15 } }}
            />
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="CPF/CNPJ"
              required
              value={form.cpf_cnpj}
              onChange={(e) => setField('cpf_cnpj', e.target.value)}
              helperText="Ex: 12.345.678/0001-99"
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome Fantasia"
              required
              value={form.nome_fantasia}
              onChange={(e) => setField('nome_fantasia', e.target.value)}
              helperText="Ex: Empresa ABC"
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Razão Social"
              required
              value={form.razao_social}
              onChange={(e) => setField('razao_social', e.target.value)}
              helperText="Ex: Empresa ABC Ltda"
            />
          </div>

          {/* Contato */}
          <p className={styles.sectionTitle}>Contato</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              helperText="Opcional"
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Telefone"
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
              value={form.cep}
              onChange={(e) => setField('cep', e.target.value)}
              helperText="Ex: 01310-100"
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Logradouro"
              value={form.logradouro}
              onChange={(e) => setField('logradouro', e.target.value)}
            />
            <TextField
              sx={{ minWidth: 100 }}
              label="Número"
              value={form.numero}
              onChange={(e) => setField('numero', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Complemento"
              value={form.complemento}
              onChange={(e) => setField('complemento', e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Bairro"
              value={form.bairro}
              onChange={(e) => setField('bairro', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="Cidade"
              value={form.cidade}
              onChange={(e) => setField('cidade', e.target.value)}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>UF</InputLabel>
              <Select
                value={form.estado}
                label="UF"
                onChange={(e) => setField('estado', e.target.value)}
              >
                <MenuItem value="">Nenhum</MenuItem>
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

          {/* Observações */}
          <p className={styles.sectionTitle}>Observações</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1 }}
              label="Observação"
              multiline
              minRows={2}
              value={form.observacao}
              onChange={(e) => setField('observacao', e.target.value)}
              helperText="Opcional"
            />
          </div>

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Parceiro
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarParceiro}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
