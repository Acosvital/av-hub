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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
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
import { useDebounce } from '@/hooks/useDebouncer';
import { getUsuarios, criarUsuario, editarUsuario } from '@/services/usuarios';
import { getCargos, getSetores, getUnidades } from '@/services/referenciais';
import {
  CargoProps,
  FormUsuario,
  SetorProps,
  UnidadeProps,
  UsuarioProps,
} from './types';

const FORM_INICIAL: FormUsuario = {
  nome_completo: '',
  email: '',
  senha: '',
  id_cargo: '',
  id_setor: '',
  id_unidade: '',
  avatar_url: '',
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
  cpf: '',
  rg: '',
  ativo: true,
  contrato_tipo: '',
  jornada_trabalho: '',
  data_nascimento: '',
  data_admissao: '',
  data_desligamento: '',
  nvl_permissao: '',
  nvl_manual: false,
};

export default function Usuarios() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [rows, setRows] = useState<UsuarioProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const [emailInput, setEmailInput] = useState('');
  const email = useDebounce(emailInput, 500);
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [cargoFiltro, setCargoFiltro] = useState<CargoProps | null>(null);
  const [setorFiltro, setSetorFiltro] = useState<SetorProps | null>(null);
  const [unidadeFiltro, setUnidadeFiltro] = useState<UnidadeProps | null>(null);

  const [cargos, setCargos] = useState<CargoProps[]>([]);
  const [setores, setSetores] = useState<SetorProps[]>([]);
  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);

  const [form, setForm] = useState<FormUsuario>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadReferenciais() {
      try {
        const [cargosData, setoresData, unidadesData] = await Promise.all([
          getCargos(),
          getSetores(),
          getUnidades(),
        ]);
        setCargos(cargosData.cargos ?? []);
        setSetores(setoresData.setores ?? []);
        setUnidades(unidadesData.unidades ?? []);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar dados de referência');
      }
    }
    loadReferenciais();
  }, []);

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        setLoading(true);
        const ativo = statusFiltro === 'todos' ? undefined : statusFiltro === 'ativo';
        const response = await getUsuarios({
          page: page + 1,
          limit: rowsPerPage,
          nome,
          email,
          ativo,
          id_cargo: cargoFiltro?.id,
          id_setor: setorFiltro?.id,
          id_unidade: unidadeFiltro?.id,
        });
        setRows(response.usuarios ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    }
    fetchUsuarios();
  }, [page, rowsPerPage, nome, email, statusFiltro, cargoFiltro, setorFiltro, unidadeFiltro, refreshTrigger]);

  const limparFiltros = () => {
    setNomeInput('');
    setEmailInput('');
    setStatusFiltro('todos');
    setCargoFiltro(null);
    setSetorFiltro(null);
    setUnidadeFiltro(null);
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (usuario: UsuarioProps) => {
    setEditingId(usuario.id);
    setForm({
      nome_completo: usuario.nome_completo,
      email: usuario.email,
      senha: '',
      id_cargo: usuario.id_cargo,
      id_setor: usuario.id_setor,
      id_unidade: usuario.id_unidade,
      avatar_url: usuario.avatar_url ?? '',
      telefone: usuario.telefone ?? '',
      celular: usuario.celular ?? '',
      homepage: usuario.homepage ?? '',
      logradouro: usuario.logradouro ?? '',
      numero: usuario.numero ?? '',
      complemento: usuario.complemento ?? '',
      bairro: usuario.bairro ?? '',
      cidade: usuario.cidade ?? '',
      estado: usuario.estado ?? '',
      cep: usuario.cep ?? '',
      cpf: usuario.cpf ?? '',
      rg: usuario.rg ?? '',
      ativo: usuario.ativo,
      contrato_tipo: usuario.contrato_tipo ?? '',
      jornada_trabalho: usuario.jornada_trabalho ?? '',
      data_nascimento: usuario.data_nascimento ?? '',
      data_admissao: usuario.data_admissao ?? '',
      data_desligamento: usuario.data_desligamento ?? '',
      nvl_permissao: usuario.nvl_permissao?.toString() ?? '',
      nvl_manual: usuario.nvl_manual,
    });
    setIsModalOpen(true);
  };

  const salvarUsuario = async () => {
    if (!editingId && !form.senha) {
      notify.error('Senha é obrigatória para novos usuários');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nome_completo: form.nome_completo,
        email: form.email,
        ...(form.senha && { senha: form.senha }),
        id_cargo: form.id_cargo,
        id_setor: form.id_setor,
        id_unidade: form.id_unidade,
        avatar_url: form.avatar_url || null,
        telefone: form.telefone || null,
        celular: form.celular || null,
        homepage: form.homepage || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        cep: form.cep || null,
        cpf: form.cpf || null,
        rg: form.rg || null,
        ativo: form.ativo,
        contrato_tipo: form.contrato_tipo || null,
        jornada_trabalho: form.jornada_trabalho || null,
        data_nascimento: form.data_nascimento || null,
        data_admissao: form.data_admissao || null,
        data_desligamento: form.data_desligamento || null,
        nvl_manual: form.nvl_manual,
        ...(form.nvl_manual && form.nvl_permissao && {
          nvl_permissao: parseInt(form.nvl_permissao),
        }),
      };

      if (editingId) {
        await editarUsuario(editingId, payload);
        notify.success('Usuário atualizado com sucesso');
      } else {
        await criarUsuario(payload);
        notify.success('Usuário cadastrado com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar usuário' : 'Erro ao cadastrar usuário');
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof FormUsuario>(field: K, value: FormUsuario[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader
        title='Usuários'
        subtitle='Gerencie os usuários do sistema'
      />
      <PageContent>
        <Card title='Filtros'>
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label='Nome'
              variant='outlined'
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label='E-mail'
              variant='outlined'
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFiltro}
                label='Status'
                onChange={(e) => {
                  setStatusFiltro(e.target.value as 'todos' | 'ativo' | 'inativo');
                  setPage(0);
                }}
              >
                <MenuItem value='todos'>Todos</MenuItem>
                <MenuItem value='ativo'>Ativo</MenuItem>
                <MenuItem value='inativo'>Inativo</MenuItem>
              </Select>
            </FormControl>            
          </div>
          <div className={styles.inputContainers}>            
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={cargos}
              getOptionLabel={(c) => c.nome}
              value={cargoFiltro}
              onChange={(_, v) => { setCargoFiltro(v); setPage(0); }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label='Cargo' />}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={setores}
              getOptionLabel={(s) => s.nome}
              value={setorFiltro}
              onChange={(_, v) => { setSetorFiltro(v); setPage(0); }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label='Setor' />}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={unidades}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidadeFiltro}
              onChange={(_, v) => { setUnidadeFiltro(v); setPage(0); }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label='Unidade' />}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button variant='secondary' onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card title='Usuários Cadastrados' create={abrirCriacaoModal}>
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
                    {['Nome', 'E-mail', 'Cargo', 'Setor', 'Unidade', 'Status'].map((label) => (
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
                      <TableCell>{row.nome_completo}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.cargo_nome ?? '—'}</TableCell>
                      <TableCell>{row.setor_nome ?? '—'}</TableCell>
                      <TableCell>{row.unidade_nome ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.ativo ? 'Ativo' : 'Inativo'}
                          color={row.ativo ? 'success' : 'error'}
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
        title={editingId ? 'Editar Usuário' : 'Novo Usuário'}
        subtitle={editingId ? form.nome_completo : 'Preencha os dados do novo usuário'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>

          {/* Dados Principais */}
          <p className={styles.sectionTitle}>Dados Principais</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 340 }}
              label='Nome Completo'
              required
              value={form.nome_completo}
              onChange={(e) => setField('nome_completo', e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 240 }}
              label='E-mail'
              type='email'
              required
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label={editingId ? 'Nova Senha (opcional)' : 'Senha'}
              type='password'
              required={!editingId}
              value={form.senha}
              onChange={(e) => setField('senha', e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <FormControl sx={{ flex: 1, minWidth: 200 }} required>
              <InputLabel>Cargo</InputLabel>
              <Select
                value={form.id_cargo}
                label='Cargo'
                onChange={(e) => setField('id_cargo', e.target.value)}
              >
                {cargos.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1, minWidth: 200 }} required>
              <InputLabel>Setor</InputLabel>
              <Select
                value={form.id_setor}
                label='Setor'
                onChange={(e) => setField('id_setor', e.target.value)}
              >
                {setores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1, minWidth: 200 }} required>
              <InputLabel>Unidade</InputLabel>
              <Select
                value={form.id_unidade}
                label='Unidade'
                onChange={(e) => setField('id_unidade', e.target.value)}
              >
                {unidades.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.nome_fantasia}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Contato */}
          <p className={styles.sectionTitle}>Contato</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label='Telefone'
              value={form.telefone}
              onChange={(e) => setField('telefone', e.target.value)}
              placeholder='(11) 3000-0000'
            />
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label='Celular'
              value={form.celular}
              onChange={(e) => setField('celular', e.target.value)}
              placeholder='(11) 99999-0000'
            />
            <TextField
              sx={{ flex: 1, minWidth: 240 }}
              label='Homepage'
              value={form.homepage}
              onChange={(e) => setField('homepage', e.target.value)}
              placeholder='https://...'
            />
          </div>

          {/* Dados Pessoais */}
          <p className={styles.sectionTitle}>Dados Pessoais</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label='CPF'
              value={form.cpf}
              onChange={(e) => setField('cpf', e.target.value)}
              placeholder='12345678901'
              slotProps={{ htmlInput: { maxLength: 11 } }}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label='RG'
              value={form.rg}
              onChange={(e) => setField('rg', e.target.value)}
              placeholder='12.345.678-9'
            />
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label='Data de Nascimento'
              type='date'
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.data_nascimento}
              onChange={(e) => setField('data_nascimento', e.target.value)}
            />
          </div>

          {/* Endereço */}
          <p className={styles.sectionTitle}>Endereço</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ minWidth: 140 }}
              label='CEP'
              value={form.cep}
              onChange={(e) => setField('cep', e.target.value)}
              placeholder='01001-000'
            />
            <TextField
              sx={{ flex: 1, minWidth: 240 }}
              label='Logradouro'
              value={form.logradouro}
              onChange={(e) => setField('logradouro', e.target.value)}
              placeholder='Rua das Flores'
            />
            <TextField
              sx={{ minWidth: 100 }}
              label='Número'
              value={form.numero}
              onChange={(e) => setField('numero', e.target.value)}
              placeholder='123'
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label='Complemento'
              value={form.complemento}
              onChange={(e) => setField('complemento', e.target.value)}
              placeholder='Apto 4B'
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label='Bairro'
              value={form.bairro}
              onChange={(e) => setField('bairro', e.target.value)}
              placeholder='Centro'
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label='Cidade'
              value={form.cidade}
              onChange={(e) => setField('cidade', e.target.value)}
              placeholder='São Paulo'
            />
            <TextField
              sx={{ minWidth: 80 }}
              label='UF'
              value={form.estado}
              onChange={(e) => setField('estado', e.target.value.toUpperCase())}
              placeholder='SP'
              slotProps={{ htmlInput: { maxLength: 2 } }}
            />
          </div>

          {/* Dados Profissionais */}
          <p className={styles.sectionTitle}>Dados Profissionais</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControl sx={{ flex: 1, minWidth: 160 }}>
              <InputLabel>Tipo de Contrato</InputLabel>
              <Select
                value={form.contrato_tipo}
                label='Tipo de Contrato'
                onChange={(e) => setField('contrato_tipo', e.target.value as FormUsuario['contrato_tipo'])}
              >
                <MenuItem value=''>—</MenuItem>
                <MenuItem value='CLT'>CLT</MenuItem>
                <MenuItem value='PJ'>PJ</MenuItem>
                <MenuItem value='Freelancer'>Freelancer</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1, minWidth: 160 }}>
              <InputLabel>Jornada de Trabalho</InputLabel>
              <Select
                value={form.jornada_trabalho}
                label='Jornada de Trabalho'
                onChange={(e) => setField('jornada_trabalho', e.target.value as FormUsuario['jornada_trabalho'])}
              >
                <MenuItem value=''>—</MenuItem>
                <MenuItem value='Integral'>Integral</MenuItem>
                <MenuItem value='Meio Período'>Meio Período</MenuItem>
                <MenuItem value='Flexível'>Flexível</MenuItem>
              </Select>
            </FormControl>
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label='Data de Admissão'
              type='date'
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.data_admissao}
              onChange={(e) => setField('data_admissao', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label='Data de Desligamento'
              type='date'
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.data_desligamento}
              onChange={(e) => setField('data_desligamento', e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.ativo}
                  onChange={(e) => setField('ativo', e.target.checked)}
                  color={'warning'}
                />
              }
              label='Usuário Ativo'
            />
          </div>

          {/* Permissões do Sistema */}
          <p className={styles.sectionTitle}>Permissões do Sistema</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.nvl_manual}
                  onChange={(e) => setField('nvl_manual', e.target.checked)}
                  color={'warning'}
                />
              }
              label='Nível manual'
            />
            <TextField
              sx={{ minWidth: 200 }}
              label='Nível de Permissão'
              type='number'
              disabled={!form.nvl_manual}
              value={form.nvl_permissao}
              onChange={(e) => setField('nvl_permissao', e.target.value)}
              helperText={!form.nvl_manual ? 'Gerenciado pelo cargo' : undefined}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </div>

          {/* Avatar */}
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 300 }}
              label='URL do Avatar'
              value={form.avatar_url}
              onChange={(e) => setField('avatar_url', e.target.value)}
              placeholder='https://...'
            />
          </div>

          <div className={styles.formActions}>
            <Button variant='secondary' onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant='primary' onClick={salvarUsuario}>
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
