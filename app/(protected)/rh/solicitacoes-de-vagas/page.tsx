'use client';
import { useEffect, useState } from 'react';
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
  SITUACAO_LABEL,
  SITUACOES_VAGA,
  SetoresProps,
  SituacaoVaga,
  SolicitacaoVagaProps,
  TIPOS_VAGA,
} from './types';
import { getSetores } from '@/services/referenciais';

const FORM_INICIAL: FormSolicitacaoVaga = {
  data_solicitacao: new Date().toISOString().slice(0, 10),
  solicitante: '',
  id_setor: '',
  cargo_vaga: '',
  observacao_motivo: '',
  quantidade: 1,
  tipo_vaga: 'CLT',
  salario: 0,
  observacao: '',
  insalubridade: 0,
  vr: 0,
  situacao: 'pendente',
};

const SITUACAO_COR: Record<SituacaoVaga, 'warning' | 'success' | 'error'> = {
  pendente: 'warning',
  aprovado: 'success',
  reprovado: 'error',
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
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [cargoInput, setCargoInput] = useState('');
  const cargo = useDebounce(cargoInput, 500);
  const [solicitanteInput, setSolicitanteInput] = useState('');
  const solicitante = useDebounce(solicitanteInput, 500);

  const [setores, setSetores] = useState<SetoresProps[]>([]);
  const [setorFiltro, setSetorFiltro] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState<SituacaoVaga | 'todos'>('todos');

  const [form, setForm] = useState<FormSolicitacaoVaga>(FORM_INICIAL);

  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  useEffect(() => {
    const loadSetores = async () => {
      try {
        const data = await getSetores();
        setSetores(data?.setores ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    loadSetores();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const situacao = situacaoFiltro === 'todos' ? undefined : situacaoFiltro;
        const response = await getSolicitacoesDeVagas({
          page: page + 1,
          limit: rowsPerPage,
          cargo: cargo || undefined,
          solicitante: solicitante || undefined,
          setor: setorFiltro || undefined,
          situacao,
        });
        setRows(response.vagas ?? []);
        setRowCount(response.total ?? 0);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar as solicitações de vagas.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, rowsPerPage, cargo, solicitante, setorFiltro, situacaoFiltro, refreshTrigger]);

  useEffect(() => {
    setPage(0);
  }, [cargo, solicitante, setorFiltro, situacaoFiltro]);

  const setorNome = (id: string) => setores.find((s) => s.id === id)?.nome ?? '—';

  const limparFiltros = () => {
    setCargoInput('');
    setSolicitanteInput('');
    setSetorFiltro('');
    setSituacaoFiltro('todos');
    setPage(0);
  };

  const abrirCriacaoModal = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setIsModalOpen(true);
  };

  const abrirEdicaoModal = (solicitacao: SolicitacaoVagaProps) => {
    setEditingId(solicitacao.id);
    setForm({
      data_solicitacao: solicitacao.data_solicitacao,
      solicitante: solicitacao.solicitante,
      id_setor: solicitacao.id_setor,
      cargo_vaga: solicitacao.cargo_vaga,
      observacao_motivo: solicitacao.observacao_motivo ?? '',
      quantidade: solicitacao.quantidade,
      tipo_vaga: solicitacao.tipo_vaga ?? 'CLT',
      salario: solicitacao.salario ?? 0,
      observacao: solicitacao.observacao ?? '',
      insalubridade: solicitacao.insalubridade ?? 0,
      vr: solicitacao.vr ?? 0,
      situacao: solicitacao.situacao,
    });
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
    if (!form.cargo_vaga.trim()) {
      notify.error('Cargo / Vaga é obrigatório');
      return;
    }
    if (!form.id_setor) {
      notify.error('Setor é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        data_solicitacao: form.data_solicitacao,
        solicitante: form.solicitante.trim(),
        id_setor: form.id_setor,
        cargo_vaga: form.cargo_vaga.trim(),
        observacao_motivo: form.observacao_motivo.trim() || null,
        quantidade: form.quantidade,
        tipo_vaga: form.tipo_vaga || null,
        salario: form.salario,
        observacao: form.observacao.trim() || null,
        insalubridade: form.insalubridade,
        vr: form.vr,
        custo_total: calcularCustoTotal(form),
        situacao: form.situacao,
      };

      if (editingId) {
        await editarSolicitacaoVaga(editingId, payload);
        notify.success('Solicitação atualizada com sucesso');
      } else {
        await criarSolicitacaoVaga(payload);
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
    message:
      'Tem certeza que deseja excluir a solicitação de vaga? Esta ação não pode ser desfeita.',
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
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Setor</InputLabel>
              <Select
                value={setorFiltro}
                label="Setor"
                onChange={(e) => setSetorFiltro(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {setores.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                    {SITUACAO_LABEL[situacao]}
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
            <>
              <div className={styles.tableWrapper}>
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
                      {rows.map((row) => (
                        <TableRow
                          hover={can('pode_editar') || can('pode_deletar')}
                          key={row.id}
                          onClick={
                            can('pode_editar') || can('pode_deletar')
                              ? () => abrirEdicaoModal(row)
                              : undefined
                          }
                          sx={{
                            cursor:
                              can('pode_editar') || can('pode_deletar') ? 'pointer' : 'default',
                          }}
                        >
                          <TableCell>{dateFormatter(row.data_solicitacao)}</TableCell>
                          <TableCell>{row.solicitante}</TableCell>
                          <TableCell>{setorNome(row.id_setor)}</TableCell>
                          <TableCell>{row.cargo_vaga}</TableCell>
                          <TableCell>{row.observacao_motivo || '—'}</TableCell>
                          <TableCell>{row.quantidade}</TableCell>
                          <TableCell>{row.tipo_vaga || '—'}</TableCell>
                          <TableCell>{toBRL(row.salario ?? 0)}</TableCell>
                          <TableCell>{row.observacao || '—'}</TableCell>
                          <TableCell>{toBRL(row.insalubridade ?? 0)}</TableCell>
                          <TableCell>{toBRL(row.vr ?? 0)}</TableCell>
                          <TableCell>{toBRL(row.custo_total ?? 0)}</TableCell>
                          <TableCell>
                            <Chip
                              label={SITUACAO_LABEL[row.situacao]}
                              color={SITUACAO_COR[row.situacao]}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              <div className={styles.mobileList}>
                {rows.length === 0 ? (
                  <div className={styles.mobileEmpty}>Nenhuma solicitação encontrada.</div>
                ) : (
                  rows.map((row) => {
                    const podeAbrir = can('pode_editar') || can('pode_deletar');
                    return (
                      <div
                        key={row.id}
                        className={`${styles.mobileCard} ${podeAbrir ? styles.mobileCardClickable : ''}`}
                        onClick={podeAbrir ? () => abrirEdicaoModal(row) : undefined}
                      >
                        <div className={styles.mobileCardHeader}>
                          <div className={styles.mobileField}>
                            <span className={styles.mobileFieldValue}>
                              {dateFormatter(row.data_solicitacao)}
                            </span>
                          </div>
                          <Chip
                            label={SITUACAO_LABEL[row.situacao]}
                            color={SITUACAO_COR[row.situacao]}
                            size="small"
                          />
                        </div>
                        <div className={styles.mobileCardHeaderMain}>
                          <span className={styles.mobileCardTitle}>{row.cargo_vaga}</span>
                          <span className={styles.mobileCardSubtitle}>
                            {row.solicitante} · {setorNome(row.id_setor)}
                          </span>
                        </div>

                        <div className={styles.mobileCardBody}>
                          <div className={styles.mobileField}>
                            <span className={styles.mobileFieldLabel}>Salário</span>
                            <span className={styles.mobileFieldValue}>
                              {toBRL(row.salario ?? 0)}
                            </span>
                          </div>
                          <div className={styles.mobileField}>
                            <span className={styles.mobileFieldLabel}>VR</span>
                            <span className={styles.mobileFieldValue}>{toBRL(row.vr ?? 0)}</span>
                          </div>
                          <div className={styles.mobileField}>
                            <span className={styles.mobileFieldLabel}>Insalubridade</span>
                            <span className={styles.mobileFieldValue}>
                              {toBRL(row.insalubridade ?? 0)}
                            </span>
                          </div>
                          <div className={styles.mobileField}>
                            <span className={styles.mobileFieldLabel}>Qtd / Tipo</span>
                            <span className={styles.mobileFieldValue}>
                              {row.quantidade} · {row.tipo_vaga || '—'}
                            </span>
                          </div>
                        </div>
                        <div className={styles.mobileCardHighlight}>
                          <span className={styles.mobileCardHighlightLabel}>Custo Total</span>
                          <span className={styles.mobileCardHighlightValue}>
                            {toBRL(row.custo_total ?? 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
          <TablePagination
            sx={{ flexShrink: 0 }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={rowCount}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage=""
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
        subtitle={editingId ? form.cargo_vaga : 'Preencha os dados da nova vaga'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className={styles.formModal}>
          <p className={styles.sectionTitle}>Dados da Solicitação</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              label="Data da Solicitação"
              type="date"
              required
              disabled={can('pode_editar')}
              value={form.data_solicitacao}
              onChange={(e) => setField('data_solicitacao', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              sx={{ flex: 1, minWidth: 240 }}
              label="Solicitante"
              required
              disabled={can('pode_editar')}
              value={form.solicitante}
              onChange={(e) => setField('solicitante', e.target.value)}
            />
            <FormControl sx={{ flex: 1, minWidth: 200 }} required>
              <InputLabel>Setor</InputLabel>
              <Select
                value={form.id_setor}
                label="Setor"
                disabled={can('pode_editar')}
                onChange={(e) => setField('id_setor', e.target.value)}
              >
                {setores.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <p className={styles.sectionTitle}>Vaga</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 2, minWidth: 240 }}
              label="Cargo / Vaga"
              required
              disabled={can('pode_editar')}
              value={form.cargo_vaga}
              onChange={(e) => setField('cargo_vaga', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 100 }}
              label="Qtd"
              type="number"
              disabled={can('pode_editar')}
              slotProps={{ htmlInput: { min: 1 } }}
              value={form.quantidade}
              onChange={(e) => setField('quantidade', Math.max(1, Number(e.target.value)))}
            />
            <FormControl sx={{ flex: 1, minWidth: 180 }}>
              <InputLabel>Tipo de Vaga</InputLabel>
              <Select
                value={form.tipo_vaga}
                label="Tipo de Vaga"
                disabled={can('pode_editar')}
                onChange={(e) =>
                  setField('tipo_vaga', e.target.value as FormSolicitacaoVaga['tipo_vaga'])
                }
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
              disabled={can('pode_editar')}
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
              disabled={can('pode_editar')}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.salario}
              onChange={(e) => setField('salario', Math.max(0, Number(e.target.value)))}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Insalubridade"
              type="number"
              disabled={can('pode_editar')}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.insalubridade}
              onChange={(e) => setField('insalubridade', Math.max(0, Number(e.target.value)))}
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="VR"
              type="number"
              disabled={can('pode_editar')}
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
              disabled={can('pode_editar')}
              minRows={2}
              value={form.observacao}
              onChange={(e) => setField('observacao', e.target.value)}
            />
            <div className={styles.custoTotalBox} style={{ flex: 1, minWidth: 200 }}>
              <span className={styles.custoTotalLabel}>Custo Total</span>
              <span className={styles.custoTotalValue}>{toBRL(custoTotal)}</span>
            </div>
          </div>
          {editingId && can('pode_editar') && (
            <>
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
                        {SITUACAO_LABEL[situacao]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </>
          )}

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
                acao={
                  editingId ? (can('pode_deletar') ? 'pode_deletar' : 'pode_editar') : 'pode_criar'
                }
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
