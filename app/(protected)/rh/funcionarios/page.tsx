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
  getFuncionarios,
  criarFuncionario,
  editarFuncionario,
  deletarFuncionario,
} from '@/services/rh/funcionarios';
import {
  definirReportaA,
  deletarOrganogramaNode,
  getOrganogramaNode,
  NIVEL_MINIMO_HIERARQUIA,
  recomputeSectorHierarchy,
} from '@/services/rh/organogramaNodes';
import { getUnidades } from '@/services/cadastros/auxiliares/unidades';
import { getSetores } from '@/services/cadastros/auxiliares/setores';
import { getCargos } from '@/services/cadastros/auxiliares/cargos';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { SetorProps } from '@/app/(protected)/cadastros/auxiliares/setores/types';
import { CargoProps } from '@/app/(protected)/cadastros/auxiliares/cargos/types';
import { TIPOS_VAGA } from '@/app/(protected)/rh/solicitacoes-de-vagas/types';
import { FormFuncionario, FuncionarioProps } from './types';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import { UFS } from '@/utils/consts';

const FORM_INICIAL: FormFuncionario = {
  nome_completo: '',
  id_cargo: '',
  id_setor: '',
  codigo_empresa: '',
  email: '',
  photo_url: '',
  cpf: '',
  rg: '',
  cnpj: '',
  contrato_tipo: '',
  jornada_trabalho: '',
  data_nascimento: '',
  data_admissao: '',
  data_desligamento: '',
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
  reporta_a_id: '',
};

export default function Funcionarios() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<FuncionarioProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [unidades, setUnidades] = useState<UnidadeProps[]>([]);
  const [setores, setSetores] = useState<SetorProps[]>([]);
  const [cargos, setCargos] = useState<CargoProps[]>([]);

  // Listas restritas à unidade escolhida no formulário — um funcionário só
  // pode ocupar um cargo/setor da mesma empresa a que está vinculado.
  const [setoresDoForm, setSetoresDoForm] = useState<SetorProps[]>([]);
  const [cargosDoForm, setCargosDoForm] = useState<CargoProps[]>([]);

  // Candidatos a "reporta a" — colegas do mesmo setor selecionado no
  // formulário, e o que o organograma tinha registrado ao abrir a edição
  // (pra saber se o usuário realmente mudou a escolha manual ou não).
  const [candidatosReportaA, setCandidatosReportaA] = useState<FuncionarioProps[]>([]);
  const [original, setOriginal] = useState<{ id_cargo: string; id_setor: string } | null>(null);
  const [reportaAOriginal, setReportaAOriginal] = useState('');

  const [nomeInput, setNomeInput] = useState('');
  const nome = useDebounce(nomeInput, 500);
  const [unidadeFiltro, setUnidadeFiltro] = useState('');
  const [setorFiltro, setSetorFiltro] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('');

  const [form, setForm] = useState<FormFuncionario>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    async function loadReferencias() {
      try {
        const [unidadesRes, setoresRes, cargosRes] = await Promise.all([
          getUnidades({ limit: 500 }),
          getSetores({ limit: 500 }),
          getCargos({ limit: 500 }),
        ]);
        setUnidades(unidadesRes.unidades ?? []);
        setSetores(setoresRes.setores ?? []);
        setCargos(cargosRes.cargos ?? []);
      } catch {
        notify.error('Erro ao carregar unidades, setores e cargos');
      }
    }
    loadReferencias();
  }, [refreshTrigger]);

  useEffect(() => {
    async function loadReferenciasDoForm() {
      if (!form.codigo_empresa) {
        setSetoresDoForm([]);
        setCargosDoForm([]);
        return;
      }
      try {
        const [setoresRes, cargosRes] = await Promise.all([
          getSetores({ codigo_empresa: form.codigo_empresa, limit: 500 }),
          getCargos({ codigo_empresa: form.codigo_empresa, limit: 500 }),
        ]);
        setSetoresDoForm(setoresRes.setores ?? []);
        setCargosDoForm(cargosRes.cargos ?? []);
      } catch {
        notify.error('Erro ao carregar setores e cargos da unidade');
      }
    }
    loadReferenciasDoForm();
  }, [form.codigo_empresa]);

  // Candidatos a "reporta a" são colegas do mesmo setor (exceto a própria
  // pessoa, ao editar) — a hierarquia manual só faz sentido dentro do setor.
  useEffect(() => {
    async function loadCandidatos() {
      if (!form.id_setor) {
        setCandidatosReportaA([]);
        return;
      }
      try {
        const data = await getFuncionarios({ id_setor: form.id_setor, limit: 500 });
        setCandidatosReportaA((data.funcionarios ?? []).filter((f) => f.id !== editingId));
      } catch {
        setCandidatosReportaA([]);
      }
    }
    loadCandidatos();
  }, [form.id_setor, editingId, refreshTrigger]);

  useEffect(() => {
    async function fetchFuncionarios() {
      try {
        setLoading(true);
        const response = await getFuncionarios({
          page: page + 1,
          limit: rowsPerPage,
          nome_completo: nome || undefined,
          codigo_empresa: unidadeFiltro || undefined,
          id_setor: setorFiltro || undefined,
          id_cargo: cargoFiltro || undefined,
        });
        setRows(response.funcionarios ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar funcionários');
      } finally {
        setLoading(false);
      }
    }
    fetchFuncionarios();
  }, [page, rowsPerPage, nome, unidadeFiltro, setorFiltro, cargoFiltro, refreshTrigger]);

  const unidadeLabel = (id: string) => unidades.find((u) => u.id === id)?.nome_fantasia ?? '—';
  const setorLabel = (id: string) => setores.find((s) => s.id === id)?.nome ?? '—';
  const cargoLabel = (id: string) => cargos.find((c) => c.id === id)?.nome ?? '—';
  const nivelDoCargo = (idCargo: string) => cargos.find((c) => c.id === idCargo)?.nvl_permissao;

  // Cargos de nível 0-1 são raízes globais no organograma — não reportam a
  // ninguém, então o campo nem aparece (ver services/rh/organogramaNodes.ts).
  const cargoSelecionadoNivel = nivelDoCargo(form.id_cargo);
  const mostrarReportaA =
    cargoSelecionadoNivel !== undefined && cargoSelecionadoNivel >= NIVEL_MINIMO_HIERARQUIA;
  const candidatosReportaAOrdenados = [...candidatosReportaA].sort(
    (a, b) => (nivelDoCargo(a.id_cargo) ?? 99) - (nivelDoCargo(b.id_cargo) ?? 99)
  );

  const limparFiltros = () => {
    setNomeInput('');
    setUnidadeFiltro('');
    setSetorFiltro('');
    setCargoFiltro('');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setOriginal(null);
    setReportaAOriginal('');
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = async (funcionario: FuncionarioProps) => {
    setEditingId(funcionario.id);
    setOriginal({ id_cargo: funcionario.id_cargo, id_setor: funcionario.id_setor });

    // O nó só conta como "reporta a" manual quando aponta pra uma pessoa —
    // se aponta pro próprio setor, é o resultado do cálculo automático.
    let reportaAAtual = '';
    try {
      const node = await getOrganogramaNode(funcionario.id);
      if (node?.parent_id && node.parent_id !== funcionario.id_setor) {
        reportaAAtual = node.parent_id;
      }
    } catch {
      // best-effort — se o organograma falhar, o campo só volta vazio (automático)
    }
    setReportaAOriginal(reportaAAtual);

    setForm({
      nome_completo: funcionario.nome_completo,
      id_cargo: funcionario.id_cargo,
      id_setor: funcionario.id_setor,
      codigo_empresa: funcionario.codigo_empresa,
      email: funcionario.email ?? '',
      photo_url: funcionario.photo_url ?? '',
      cpf: funcionario.cpf ?? '',
      rg: funcionario.rg ?? '',
      cnpj: funcionario.cnpj ?? '',
      contrato_tipo: funcionario.contrato_tipo ?? '',
      jornada_trabalho: funcionario.jornada_trabalho ?? '',
      data_nascimento: funcionario.data_nascimento ?? '',
      data_admissao: funcionario.data_admissao ?? '',
      data_desligamento: funcionario.data_desligamento ?? '',
      telefone: funcionario.telefone ?? '',
      celular: funcionario.celular ?? '',
      homepage: funcionario.homepage ?? '',
      logradouro: funcionario.logradouro ?? '',
      numero: funcionario.numero ?? '',
      complemento: funcionario.complemento ?? '',
      bairro: funcionario.bairro ?? '',
      cidade: funcionario.cidade ?? '',
      estado: funcionario.estado ?? '',
      cep: funcionario.cep ?? '',
      reporta_a_id: reportaAAtual,
    });
    setIsModalOpen(true);
  };

  const salvarFuncionario = async () => {
    if (!form.nome_completo.trim()) {
      notify.error('Nome completo é obrigatório');
      return;
    }
    if (!form.codigo_empresa) {
      notify.error('Unidade é obrigatória');
      return;
    }
    if (!form.id_setor) {
      notify.error('Setor é obrigatório');
      return;
    }
    if (!form.id_cargo) {
      notify.error('Cargo é obrigatório');
      return;
    }
    if (!form.email.trim()) {
      notify.error('E-mail é obrigatório');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      notify.error('E-mail inválido');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nome_completo: form.nome_completo.trim(),
        id_cargo: form.id_cargo,
        id_setor: form.id_setor,
        codigo_empresa: form.codigo_empresa,
        email: form.email.trim(),
        photo_url: form.photo_url.trim() || null,
        cpf: form.cpf.trim() || null,
        rg: form.rg.trim() || null,
        cnpj: form.cnpj.trim() || null,
        contrato_tipo: form.contrato_tipo || null,
        jornada_trabalho: form.jornada_trabalho.trim() || null,
        data_nascimento: form.data_nascimento || null,
        data_admissao: form.data_admissao || null,
        data_desligamento: form.data_desligamento || null,
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
      };

      let novoId = editingId;
      if (editingId) {
        await editarFuncionario(editingId, payload);
        notify.success('Funcionário atualizado com sucesso');
      } else {
        const criado = (await criarFuncionario(payload)) as { id: string };
        novoId = criado.id;
        notify.success('Funcionário cadastrado com sucesso');
      }

      // Mantém o organograma consistente — best-effort: uma falha aqui não
      // deve derrubar o cadastro do funcionário, que já foi salvo com sucesso.
      if (novoId) {
        const cargoMudou = !editingId || original?.id_cargo !== payload.id_cargo;
        const setorMudou = !editingId || original?.id_setor !== payload.id_setor;
        const reportaAMudou = form.reporta_a_id !== reportaAOriginal;
        if (cargoMudou || setorMudou || reportaAMudou) {
          try {
            await recomputeSectorHierarchy(payload.id_setor);
            if (editingId && setorMudou && original) {
              await recomputeSectorHierarchy(original.id_setor);
            }
            if (form.reporta_a_id) {
              await definirReportaA(novoId, form.reporta_a_id);
            }
          } catch (err) {
            console.error('Falha ao sincronizar hierarquia do organograma', err);
          }
        }
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar funcionário' : 'Erro ao cadastrar funcionário');
    } finally {
      setSaving(false);
    }
  };

  const excluirFuncionario = async () => {
    if (!editingId) return;
    const idSetorAntigo = form.id_setor;
    try {
      await deletarFuncionario(editingId);
      notify.success('Funcionário excluído com sucesso');

      // Best-effort — remove o nó dessa pessoa e redistribui quem reportava a ela.
      try {
        await deletarOrganogramaNode(editingId);
        if (idSetorAntigo) await recomputeSectorHierarchy(idSetorAntigo);
      } catch (err) {
        console.error('Falha ao atualizar organograma após exclusão', err);
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir funcionário');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirFuncionario,
    message: 'Tem certeza que deseja excluir o funcionário? Esta ação não pode ser desfeita.',
    title: 'Excluir Funcionário',
  });

  const setField = <K extends keyof FormFuncionario>(field: K, value: FormFuncionario[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <PageHeader title="Funcionários" subtitle="Gerencie os funcionários cadastrados no sistema" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Nome"
              variant="outlined"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
            />
            <Autocomplete
              sx={{ minWidth: 200 }}
              options={unidades}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidades.find((u) => u.id === unidadeFiltro) ?? null}
              onChange={(_, v) => {
                setUnidadeFiltro(v?.id ?? '');
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Unidade" />}
            />
            <Autocomplete
              sx={{ minWidth: 200 }}
              options={setores}
              getOptionLabel={(s) => s.nome}
              value={setores.find((s) => s.id === setorFiltro) ?? null}
              onChange={(_, v) => {
                setSetorFiltro(v?.id ?? '');
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Setor" />}
            />
            <Autocomplete
              sx={{ minWidth: 200 }}
              options={cargos}
              getOptionLabel={(c) => c.nome}
              value={cargos.find((c) => c.id === cargoFiltro) ?? null}
              onChange={(_, v) => {
                setCargoFiltro(v?.id ?? '');
                setPage(0);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Cargo" />}
            />
          </div>
          <div className={styles.cardButtons}>
            <Button variant="secondary" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </Card>

        <Card
          title="Funcionários Cadastrados"
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
                    {['Nome Completo', 'E-mail', 'Cargo', 'Setor', 'Unidade', 'Telefone', 'Contrato'].map(
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
                      <TableCell>{row.nome_completo}</TableCell>
                      <TableCell>{row.email ?? '—'}</TableCell>
                      <TableCell>{cargoLabel(row.id_cargo)}</TableCell>
                      <TableCell>{setorLabel(row.id_setor)}</TableCell>
                      <TableCell>{unidadeLabel(row.codigo_empresa)}</TableCell>
                      <TableCell>{row.telefone ?? row.celular ?? '—'}</TableCell>
                      <TableCell>{row.contrato_tipo ?? '—'}</TableCell>
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
        title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
        subtitle={editingId ? form.nome_completo : 'Preencha os dados do novo funcionário'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          {/* Dados Pessoais */}
          <p className={styles.sectionTitle}>Dados Pessoais</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Nome Completo"
              required
              value={form.nome_completo}
              onChange={(e) => setField('nome_completo', e.target.value)}
            />
            <TextField
              sx={{ minWidth: 160 }}
              label="Data de Nascimento"
              type="date"
              value={form.data_nascimento}
              onChange={(e) => setField('data_nascimento', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="CPF"
              value={form.cpf}
              onChange={(e) => setField('cpf', e.target.value)}
              helperText="Opcional"
            />
            <TextField
              sx={{ flex: 1, minWidth: 140 }}
              label="RG"
              value={form.rg}
              onChange={(e) => setField('rg', e.target.value)}
              helperText="Opcional"
            />
            <TextField
              sx={{ flex: 1, minWidth: 180 }}
              label="CNPJ"
              value={form.cnpj}
              onChange={(e) => setField('cnpj', e.target.value)}
              helperText="Opcional — para contrato PJ"
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="URL da Foto"
              value={form.photo_url}
              onChange={(e) => setField('photo_url', e.target.value)}
              helperText="Opcional"
            />
          </div>

          {/* Vínculo */}
          <p className={styles.sectionTitle}>Vínculo</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={unidades}
              getOptionLabel={(u) => u.nome_fantasia}
              value={unidades.find((u) => u.id === form.codigo_empresa) ?? null}
              onChange={(_, v) => {
                setField('codigo_empresa', v?.id ?? '');
                setField('id_setor', '');
                setField('id_cargo', '');
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Unidade" required />}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={setoresDoForm}
              getOptionLabel={(s) => s.nome}
              value={setoresDoForm.find((s) => s.id === form.id_setor) ?? null}
              onChange={(_, v) => {
                setField('id_setor', v?.id ?? '');
                // As opções de "reporta a" são só do setor — muda o setor, some a escolha.
                setField('reporta_a_id', '');
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!form.codigo_empresa}
              renderInput={(params) => <TextField {...params} label="Setor" required />}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={cargosDoForm}
              getOptionLabel={(c) => c.nome}
              value={cargosDoForm.find((c) => c.id === form.id_cargo) ?? null}
              onChange={(_, v) => setField('id_cargo', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              disabled={!form.codigo_empresa}
              renderInput={(params) => <TextField {...params} label="Cargo" required />}
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="E-mail"
              required
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              helperText="Usado para vincular o funcionário a um usuário do sistema"
            />
          </div>
          {mostrarReportaA && (
            <div className={styles.formRow}>
              <Autocomplete
                sx={{ flex: 1, minWidth: 260 }}
                options={candidatosReportaAOrdenados}
                getOptionLabel={(f) => `${f.nome_completo} — ${cargoLabel(f.id_cargo)}`}
                value={candidatosReportaAOrdenados.find((f) => f.id === form.reporta_a_id) ?? null}
                onChange={(_, v) => setField('reporta_a_id', v?.id ?? '')}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Reporta a"
                    placeholder="— Automático pelo setor"
                    helperText="Opcional. Se não escolher, o sistema define automaticamente com base no cargo dentro do setor."
                  />
                )}
              />
            </div>
          )}
          <div className={styles.formRow}>
            <FormControl sx={{ flex: 1, minWidth: 180 }}>
              <InputLabel>Tipo de Contrato</InputLabel>
              <Select
                value={form.contrato_tipo}
                label="Tipo de Contrato"
                onChange={(e) => setField('contrato_tipo', e.target.value)}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {TIPOS_VAGA.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Jornada de Trabalho"
              value={form.jornada_trabalho}
              onChange={(e) => setField('jornada_trabalho', e.target.value)}
              helperText="Opcional — ex: 44h semanais"
            />
            <TextField
              sx={{ minWidth: 160 }}
              label="Data de Admissão"
              type="date"
              value={form.data_admissao}
              onChange={(e) => setField('data_admissao', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              sx={{ minWidth: 160 }}
              label="Data de Desligamento"
              type="date"
              value={form.data_desligamento}
              onChange={(e) => setField('data_desligamento', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </div>

          {/* Contato */}
          <p className={styles.sectionTitle}>Contato</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Telefone"
              value={form.telefone}
              onChange={(e) => setField('telefone', e.target.value)}
              helperText="Opcional"
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Celular"
              value={form.celular}
              onChange={(e) => setField('celular', e.target.value)}
              helperText="Opcional"
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
              helperText="Opcional"
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

          <div
            className={
              editingId && can('pode_deletar') ? styles.formActionsWithDelete : styles.formActions
            }
          >
            {editingId && (
              <PermissionButton acao="pode_deletar" variant="danger" onClick={openDeleteDialog}>
                Excluir Funcionário
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarFuncionario}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
}
