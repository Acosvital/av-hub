'use client';
import { useEffect, useMemo, useState } from 'react';
import styles from './styles.module.css';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import Card from '@/components/Ui/Card/Card';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
import {
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from '@mui/material';
import dateFormatter from '@/utils/dateFormatter';
import toBRL from '@/utils/toBRL';
import {
  criarSolicitacaoVaga,
  deletarSolicitacaoVaga,
  editarSolicitacaoVaga,
  getSolicitacoesDeVagas,
} from '@/services/solicitacoesDeVagas';
import {
  FormSolicitacaoVaga,
  SITUACOES_VAGA,
  SituacaoVaga,
  SolicitacaoVagaProps,
  TIPOS_VAGA,
} from './types';
import normalizeText from '@/utils/normalizeText';

const FORM_INICIAL: FormSolicitacaoVaga = {
  solicitante: '',
  setor: '',
  cargo: '',
  observacao_motivo: '',
  quantidade: 1,
  tipo_vaga: 'CLT',
  salario: 0,
  obs: '',
  insalubridade: 0,
  vr: 0,
  situacao: 'Pendente',
};

const SITUACAO_COR: Record<SituacaoVaga, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  Pendente: 'warning',
  'Em Análise': 'info',
  Aprovada: 'success',
  Reprovada: 'error',
  Cancelada: 'default',
};

function calcularCustoTotal(form: FormSolicitacaoVaga): number {
  const quantidade = Number(form.quantidade) || 0;
  const salario = Number(form.salario) || 0;
  const insalubridade = Number(form.insalubridade) || 0;
  const vr = Number(form.vr) || 0;
  return quantidade * (salario + insalubridade + vr);
}

const SolicitacoesDeVagas = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { can } = usePermission();

  const [rows, setRows] = useState<SolicitacaoVagaProps[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [cargoInput, setCargoInput] = useState('');
  const cargo = useDebounce(cargoInput, 500);
  const [solicitanteInput, setSolicitanteInput] = useState('');
  const solicitante = useDebounce(solicitanteInput, 500);
  const [setorInput, setSetorInput] = useState('');
  const setor = useDebounce(setorInput, 500);
  const [situacaoFiltro, setSituacaoFiltro] = useState<SituacaoVaga | 'todos'>('todos');

  const [form, setForm] = useState<FormSolicitacaoVaga>(FORM_INICIAL);
  const [dataSolicitacao, setDataSolicitacao] = useState<string | null>(null);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getSolicitacoesDeVagas();
        setRows(response.solicitacoes ?? []);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar as solicitações de vagas.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  const filteredRows = useMemo(() => {
    const termoCargo = normalizeText(cargo);
    const termoSolicitante = normalizeText(solicitante);
    const termoSetor = normalizeText(setor);
    return rows.filter((row) => {
      const matchCargo = !termoCargo || normalizeText(row.cargo).includes(termoCargo);
      const matchSolicitante =
        !termoSolicitante || normalizeText(row.solicitante).includes(termoSolicitante);
      const matchSetor = !termoSetor || normalizeText(row.setor).includes(termoSetor);
      const matchSituacao = situacaoFiltro === 'todos' || row.situacao === situacaoFiltro;
      return matchCargo && matchSolicitante && matchSetor && matchSituacao;
    });
  }, [rows, cargo, solicitante, setor, situacaoFiltro]);

  useEffect(() => {
    setPage(0);
  }, [cargo, solicitante, setor, situacaoFiltro]);

  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage]
  );

  const limparFiltros = () => {
    setCargoInput('');
    setSolicitanteInput('');
    setSetorInput('');
    setSituacaoFiltro('todos');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setDataSolicitacao(null);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (solicitacao: SolicitacaoVagaProps) => {
    setEditingId(solicitacao.id);
    setForm({
      solicitante: solicitacao.solicitante,
      setor: solicitacao.setor,
      cargo: solicitacao.cargo,
      observacao_motivo: solicitacao.observacao_motivo,
      quantidade: solicitacao.quantidade,
      tipo_vaga: solicitacao.tipo_vaga,
      salario: solicitacao.salario,
      obs: solicitacao.obs,
      insalubridade: solicitacao.insalubridade,
      vr: solicitacao.vr,
      situacao: solicitacao.situacao,
    });
    setDataSolicitacao(solicitacao.data_solicitacao);
    setIsModalOpen(true);
  };

  const setField = <K extends keyof FormSolicitacaoVaga>(
    field: K,
    value: FormSolicitacaoVaga[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const salvarSolicitacao = async () => {
    if (!form.solicitante.trim()) {
      notify.error('Solicitante é obrigatório');
      return;
    }
    if (!form.cargo.trim()) {
      notify.error('Cargo / Vaga é obrigatório');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await editarSolicitacaoVaga(editingId, form);
        notify.success('Solicitação atualizada com sucesso');
      } else {
        await criarSolicitacaoVaga(form);
        notify.success('Solicitação cadastrada com sucesso');
      }

      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError(editingId ? 'Erro ao atualizar solicitação' : 'Erro ao cadastrar solicitação');
    } finally {
      setSaving(false);
    }
  };

  const excluirSolicitacao = async () => {
    if (!editingId) return;
    try {
      await deletarSolicitacaoVaga(editingId);
      notify.success('Solicitação excluída com sucesso');
      setIsModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir solicitação');
      throw err;
    }
  };

  const { openDialog: openDeleteDialog, dialog: deleteDialog } = useDeleteDialog({
    onConfirm: excluirSolicitacao,
    message: 'Tem certeza que deseja excluir a solicitação de vaga? Esta ação não pode ser desfeita.',
    title: 'Excluir Solicitação',
  });

  const custoTotal = calcularCustoTotal(form);

  return (
    <>
      <PageHeader title="Solicitações de Vagas" subtitle="Consulte as vagas cadastradas" />
      <PageContent>
        <Card title="Filtros" height="fit">
          <div className={styles.inputContainers}>
            <TextField
              sx={{ flex: 2, minWidth: 300 }}
              label="Cargo / Vaga"
              variant="outlined"
              value={cargoInput}
              onChange={(e) => setCargoInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Solicitante"
              variant="outlined"
              value={solicitanteInput}
              onChange={(e) => setSolicitanteInput(e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              label="Setor"
              variant="outlined"
              value={setorInput}
              onChange={(e) => setSetorInput(e.target.value)}
            />
            <FormControl sx={{ flex: 1, minWidth: 220 }}>
              <InputLabel>Situação</InputLabel>
              <Select
                value={situacaoFiltro}
                label="Situação"
                onChange={(e) => setSituacaoFiltro(e.target.value as SituacaoVaga | 'todos')}
              >
                <MenuItem value="todos">Todas</MenuItem>
                {SITUACOES_VAGA.map((situacao) => (
                  <MenuItem key={situacao} value={situacao}>
                    {situacao}
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
        <Card title="Lista de Vagas" create={can('pode_criar') ? abrirCriacaoModal : undefined}>
          {loading ? (
            <div className={styles.loading}>
              <CircularProgress size={50} />
              <span>Carregando...</span>
            </div>
          ) : (
            <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {[
                      'Data da Solicitação',
                      'Solicitante',
                      'Setor',
                      'Cargo / Vaga',
                      'Observação / Motivo',
                      'Qtd',
                      'Tipo de Vaga',
                      'Salário',
                      'Obs.',
                      'Insalubridade',
                      'VR',
                      'Custo Total',
                      'Situação',
                    ].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRows.map((row) => (
                    <TableRow
                      hover={can('pode_editar')}
                      key={row.id}
                      onClick={can('pode_editar') ? () => abrirEdicaoModal(row) : undefined}
                      sx={{ cursor: can('pode_editar') ? 'pointer' : 'default' }}
                    >
                      <TableCell>{dateFormatter(row.data_solicitacao)}</TableCell>
                      <TableCell>{row.solicitante}</TableCell>
                      <TableCell>{row.setor}</TableCell>
                      <TableCell>{row.cargo}</TableCell>
                      <TableCell>{row.observacao_motivo || '—'}</TableCell>
                      <TableCell>{row.quantidade}</TableCell>
                      <TableCell>{row.tipo_vaga}</TableCell>
                      <TableCell>{toBRL(row.salario)}</TableCell>
                      <TableCell>{row.obs || '—'}</TableCell>
                      <TableCell>{toBRL(row.insalubridade)}</TableCell>
                      <TableCell>{toBRL(row.vr)}</TableCell>
                      <TableCell>
                        {toBRL(row.quantidade * (row.salario + row.insalubridade + row.vr))}
                      </TableCell>
                      <TableCell>
                        <Chip label={row.situacao} color={SITUACAO_COR[row.situacao]} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            sx={{ flexShrink: 0 }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredRows.length}
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
        title={editingId ? 'Editar Solicitação' : 'Nova Solicitação de Vaga'}
        subtitle={editingId ? form.cargo : 'Preencha os dados da nova vaga'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <p className={styles.sectionTitle}>Dados da Solicitação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <div className={styles.infoBox} style={{ flex: 1, minWidth: 200 }}>
              <span className={styles.infoLabel}>Data da Solicitação</span>
              <span className={styles.infoValue}>
                {dataSolicitacao ? dateFormatter(dataSolicitacao) : 'Definida ao salvar'}
              </span>
            </div>
            <TextField
              sx={{ flex: 1, minWidth: 240 }}
              label="Solicitante"
              required
              value={form.solicitante}
              onChange={(e) => setField('solicitante', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Setor"
              value={form.setor}
              onChange={(e) => setField('setor', e.target.value)}
            />
          </div>

          <p className={styles.sectionTitle}>Vaga</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 2, minWidth: 240 }}
              label="Cargo / Vaga"
              required
              value={form.cargo}
              onChange={(e) => setField('cargo', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 100 }}
              label="Qtd"
              type="number"
              slotProps={{ htmlInput: { min: 1 } }}
              value={form.quantidade}
              onChange={(e) => setField('quantidade', Math.max(1, Number(e.target.value)))}
            />
            <FormControl sx={{ flex: 1, minWidth: 180 }}>
              <InputLabel>Tipo de Vaga</InputLabel>
              <Select
                value={form.tipo_vaga}
                label="Tipo de Vaga"
                onChange={(e) => setField('tipo_vaga', e.target.value as FormSolicitacaoVaga['tipo_vaga'])}
              >
                {TIPOS_VAGA.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Observação / Motivo"
              multiline
              minRows={2}
              value={form.observacao_motivo}
              onChange={(e) => setField('observacao_motivo', e.target.value)}
            />
          </div>

          <p className={styles.sectionTitle}>Remuneração</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Salário"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.salario}
              onChange={(e) => setField('salario', Math.max(0, Number(e.target.value)))}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Insalubridade"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.insalubridade}
              onChange={(e) => setField('insalubridade', Math.max(0, Number(e.target.value)))}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="VR"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.vr}
              onChange={(e) => setField('vr', Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Obs."
              multiline
              minRows={2}
              value={form.obs}
              onChange={(e) => setField('obs', e.target.value)}
            />
            <div className={styles.custoTotalBox} style={{ flex: 1, minWidth: 200 }}>
              <span className={styles.custoTotalLabel}>Custo Total</span>
              <span className={styles.custoTotalValue}>{toBRL(custoTotal)}</span>
            </div>
          </div>

          <p className={styles.sectionTitle}>Situação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <FormControl sx={{ flex: 1, minWidth: 220 }}>
              <InputLabel>Situação</InputLabel>
              <Select
                value={form.situacao}
                label="Situação"
                onChange={(e) => setField('situacao', e.target.value as SituacaoVaga)}
              >
                {SITUACOES_VAGA.map((situacao) => (
                  <MenuItem key={situacao} value={situacao}>
                    {situacao}
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
                Excluir Solicitação
              </PermissionButton>
            )}
            <div className={styles.formActionsMain}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <PermissionButton
                acao={editingId ? 'pode_editar' : 'pode_criar'}
                variant="primary"
                onClick={salvarSolicitacao}
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Solicitação'}
              </PermissionButton>
            </div>
          </div>
        </div>
      </Modal>
      {deleteDialog}
    </>
  );
};

export default SolicitacoesDeVagas;
