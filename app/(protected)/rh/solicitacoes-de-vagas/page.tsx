'use client';
import { useEffect, useState } from 'react';
import styles from './styles.module.css';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import PermissionButton from '@/components/Ui/PermissionButton/PermissionButton';
import { notify } from '@/lib/toast/toast';
import { useDebounce } from '@/hooks/useDebouncer';
import { useDeleteDialog } from '@/hooks/useDeleteDialog';
import { usePermission } from '@/hooks/usePermission';
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
import { FaPlus } from 'react-icons/fa';
import { LuCheck, LuClock, LuX } from 'react-icons/lu';
import dateFormatter from '@/utils/dateFormatter';
import toBRL from '@/utils/toBRL';
import {
  criarSolicitacaoVaga,
  deletarSolicitacaoVaga,
  editarSolicitacaoVaga,
  getSolicitacoesDeVagas,
} from '@/services/rh/solicitacoesDeVagas';
import {
  FormSolicitacaoVaga,
  SITUACAO_LABEL,
  SITUACOES_VAGA,
  SetoresProps,
  SituacaoVaga,
  SolicitacaoVagaProps,
  TIPOS_VAGA,
} from './types';
import { getSetores } from '@/services/rh/referenciais';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';

const FORM_INICIAL: FormSolicitacaoVaga = {
  data_solicitacao: new Date().toISOString().slice(0, 10),
  solicitante: '',
  id_setor: '',
  cargo_vaga: '',
  observacao_motivo: '',
  quantidade: 1,
  tipo_vaga: 'CLT',
  salario: '',
  observacao: '',
  insalubridade: '',
  vr: '',
  situacao: 'pendente',
  observacao_situacao: '',
};

const SITUACAO_ESTILO: Record<SituacaoVaga, { bg: string; color: string }> = {
  pendente: { bg: 'color-mix(in srgb, var(--yellow) 20%, transparent)', color: 'var(--yellow)' },
  aprovado: { bg: 'color-mix(in srgb, var(--success) 20%, transparent)', color: 'var(--success)' },
  reprovado: { bg: 'color-mix(in srgb, var(--danger) 20%, transparent)', color: 'var(--danger)' },
};

function SituacaoChip({ situacao }: { situacao: SituacaoVaga }) {
  const estilo = SITUACAO_ESTILO[situacao];
  return (
    <Chip
      label={SITUACAO_LABEL[situacao]}
      size="small"
      sx={{
        bgcolor: estilo.bg,
        color: estilo.color,
        fontWeight: 700,
        border: `1px solid ${estilo.color}`,
      }}
    />
  );
}

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

  const { can, canOnly } = usePermission();

  const [rows, setRows] = useState<SolicitacaoVagaProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [cargoInput, setCargoInput] = useState('');
  const cargo = useDebounce(cargoInput, 500);

  const [setores, setSetores] = useState<SetoresProps[]>([]);
  const [setorFiltro, setSetorFiltro] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState<SituacaoVaga | 'todos'>('todos');

  const [form, setForm] = useState<FormSolicitacaoVaga>(FORM_INICIAL);

  // Resumo pro diretor: quantas pendentes e quanto custam, além do total já
  // aprovado. Busca à parte da tabela paginada, senão os números refletiriam
  // só a página atual.
  const [resumoPendentes, setResumoPendentes] = useState({ count: 0, custo: 0 });
  const [resumoAprovadas, setResumoAprovadas] = useState(0);

  // Decisão rápida direto na linha (sem abrir o modal) — qual solicitação
  // está "em decisão" e o que foi escolhido, antes de confirmar.
  const [decisaoRapida, setDecisaoRapida] = useState<{ id: string; situacao: SituacaoVaga } | null>(
    null
  );
  const [obsRapida, setObsRapida] = useState('');
  const [salvandoRapida, setSalvandoRapida] = useState(false);

  // Lista + detalhe fixo: qual solicitação está selecionada no painel da
  // direita, e o estado de decisão (situação/observação) pendente nela.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [painelSituacao, setPainelSituacao] = useState<SituacaoVaga>('pendente');
  const [painelObs, setPainelObs] = useState('');
  const [salvandoPainel, setSalvandoPainel] = useState(false);

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
  }, [page, rowsPerPage, cargo, setorFiltro, situacaoFiltro, refreshTrigger]);

  useEffect(() => {
    setPage(0);
  }, [cargo, setorFiltro, situacaoFiltro]);

  useEffect(() => {
    async function fetchResumo() {
      try {
        const [pendentesRes, aprovadasRes] = await Promise.all([
          getSolicitacoesDeVagas({ situacao: 'pendente', limit: 500 }),
          getSolicitacoesDeVagas({ situacao: 'aprovado', limit: 1 }),
        ]);
        const custo = (pendentesRes.vagas ?? []).reduce(
          (soma, v) => soma + (v.custo_total ?? 0),
          0
        );
        setResumoPendentes({ count: pendentesRes.total ?? 0, custo });
        setResumoAprovadas(aprovadasRes.total ?? 0);
      } catch (err) {
        console.error('Erro ao carregar resumo de vagas', err);
      }
    }
    fetchResumo();
  }, [refreshTrigger]);

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!rows.some((r) => r.id === selectedId)) {
      setSelectedId(rows[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => {
    const row = rows.find((r) => r.id === selectedId);
    if (row) {
      setPainelSituacao(row.situacao);
      setPainelObs(row.observacao_situacao ?? '');
    }
  }, [selectedId, rows]);

  const setorNome = (id: string) => setores.find((s) => s.id === id)?.nome ?? '—';

  // Quem só tem editar+visualizar (sem criar/deletar) é o papel "diretor" —
  // decide, mas não registra a solicitação. Ver contrato de permissões em
  // hooks/usePermission.ts.
  const isApprover = canOnly('pode_editar', 'pode_visualizar');

  const abrirDecisaoRapida = (row: SolicitacaoVagaProps, situacao: SituacaoVaga) => {
    setDecisaoRapida({ id: row.id, situacao });
    setObsRapida('');
  };

  const cancelarDecisaoRapida = () => {
    setDecisaoRapida(null);
    setObsRapida('');
  };

  const confirmarDecisaoRapida = async (row: SolicitacaoVagaProps) => {
    if (!decisaoRapida) return;
    try {
      setSalvandoRapida(true);
      await editarSolicitacaoVaga(row.id, {
        data_solicitacao: row.data_solicitacao,
        solicitante: row.solicitante,
        id_setor: row.id_setor,
        cargo_vaga: row.cargo_vaga,
        observacao_motivo: row.observacao_motivo,
        quantidade: row.quantidade,
        tipo_vaga: row.tipo_vaga,
        salario: row.salario,
        observacao: row.observacao,
        insalubridade: row.insalubridade,
        vr: row.vr,
        custo_total: row.custo_total,
        situacao: decisaoRapida.situacao,
        observacao_situacao: obsRapida.trim(),
      });
      notify.success(
        decisaoRapida.situacao === 'aprovado' ? 'Solicitação aprovada' : 'Solicitação reprovada'
      );
      setDecisaoRapida(null);
      setObsRapida('');
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      notify.error('Erro ao atualizar a solicitação');
    } finally {
      setSalvandoRapida(false);
    }
  };

  const selecionarSolicitacao = (row: SolicitacaoVagaProps) => {
    setSelectedId(row.id);
  };

  const confirmarDecisaoPainel = async () => {
    const row = rows.find((r) => r.id === selectedId);
    if (!row) return;
    try {
      setSalvandoPainel(true);
      await editarSolicitacaoVaga(row.id, {
        data_solicitacao: row.data_solicitacao,
        solicitante: row.solicitante,
        id_setor: row.id_setor,
        cargo_vaga: row.cargo_vaga,
        observacao_motivo: row.observacao_motivo,
        quantidade: row.quantidade,
        tipo_vaga: row.tipo_vaga,
        salario: row.salario,
        observacao: row.observacao,
        insalubridade: row.insalubridade,
        vr: row.vr,
        custo_total: row.custo_total,
        situacao: painelSituacao,
        observacao_situacao: painelObs.trim(),
      });
      notify.success('Decisão salva com sucesso');
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      console.error(err);
      notify.error('Erro ao salvar a decisão');
    } finally {
      setSalvandoPainel(false);
    }
  };

  const FILTROS_VAGA = [
    {
      key: 'setor',
      label: 'Setor',
      options: setores.map((s) => ({ value: s.id, label: s.nome })),
    },
    {
      key: 'situacao',
      label: 'Situação',
      options: SITUACOES_VAGA.map((s) => ({ value: s, label: SITUACAO_LABEL[s] })),
    },
  ];

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
      salario: solicitacao.salario ?? '',
      observacao: solicitacao.observacao ?? '',
      insalubridade: solicitacao.insalubridade ?? '',
      vr: solicitacao.vr ?? '',
      situacao: solicitacao.situacao,
      observacao_situacao: solicitacao.observacao_situacao ?? '',
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
        salario: form.salario === '' ? null : form.salario,
        observacao: form.observacao.trim() || null,
        insalubridade: form.insalubridade === '' ? null : form.insalubridade,
        vr: form.vr === '' ? null : form.vr,
        custo_total: calcularCustoTotal(form),
        situacao: form.situacao,
        observacao_situacao: form.observacao_situacao,
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
  const selectedRow = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <>
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader title="Solicitações de Vagas" subtitle="Consulte as vagas cadastradas" />
        {can('pode_criar') && (
          <Button variant="primary" icon={<FaPlus size={14} />} onClick={abrirCriacaoModal}>
            Novo
          </Button>
        )}
      </div>
      {isApprover && (
        <div className={styles.kpiStrip}>
          <span className={`${styles.kpiChip} ${styles.kpiChipWarn}`}>
            <LuClock size={13} />
            {resumoPendentes.count} pendente{resumoPendentes.count === 1 ? '' : 's'}
          </span>
          <span className={styles.kpiChip}>{toBRL(resumoPendentes.custo)} em aprovação</span>
          <span className={styles.kpiChip}>
            {resumoAprovadas} aprovada{resumoAprovadas === 1 ? '' : 's'} ao todo
          </span>
        </div>
      )}
      <PageContent>
        <div className={styles.tableCard}>
          <SearchFilterBar
            searchValue={cargoInput}
            onSearchChange={(value) => {
              setCargoInput(value);
              setPage(0);
            }}
            searchPlaceholder="Buscar por cargo/vaga..."
            filters={FILTROS_VAGA}
            activeValues={{
              setor: setorFiltro || undefined,
              situacao: situacaoFiltro !== 'todos' ? situacaoFiltro : undefined,
            }}
            onFilterChange={(key, value) => {
              if (key === 'setor') setSetorFiltro(value ?? '');
              else if (key === 'situacao')
                setSituacaoFiltro((value as SituacaoVaga | null) ?? 'todos');
              setPage(0);
            }}
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
                <div className={styles.splitWrap}>
                  <div className={styles.splitList}>
                    {rows.length === 0 ? (
                      <div className={styles.mobileEmpty}>Nenhuma solicitação encontrada.</div>
                    ) : (
                      rows.map((row) => (
                        <div
                          key={row.id}
                          className={`${styles.splitItem} ${
                            row.id === selectedId ? styles.splitItemSelected : ''
                          }`}
                          onClick={() => selecionarSolicitacao(row)}
                        >
                          <div className={styles.splitItemTop}>
                            <span className={styles.splitItemTitle}>{row.cargo_vaga}</span>
                            <SituacaoChip situacao={row.situacao} />
                          </div>
                          <span className={styles.splitItemSub}>
                            {setorNome(row.id_setor)} · {row.solicitante}
                          </span>
                          <div className={styles.splitItemFoot}>
                            <span>{dateFormatter(row.data_solicitacao)}</span>
                            <span className={styles.splitItemCusto}>
                              {toBRL(row.custo_total ?? 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={styles.splitDetail}>
                    {selectedRow ? (
                      <>
                        <div className={styles.reviewSummary}>
                          <div className={styles.reviewTitleRow}>
                            <span className={styles.mobileCardTitle}>
                              {selectedRow.cargo_vaga}
                            </span>
                            <SituacaoChip situacao={selectedRow.situacao} />
                          </div>
                          <span className={styles.reviewSub}>
                            {setorNome(selectedRow.id_setor)} · {selectedRow.solicitante} ·{' '}
                            {dateFormatter(selectedRow.data_solicitacao)}
                          </span>
                        </div>

                        <div className={styles.reviewFacts}>
                          <div>
                            <span className={styles.factLabel}>Qtd / Tipo</span>
                            <span className={styles.factValue}>
                              {selectedRow.quantidade} · {selectedRow.tipo_vaga || '—'}
                            </span>
                          </div>
                          <div>
                            <span className={styles.factLabel}>Salário unit.</span>
                            <span className={styles.factValue}>
                              {toBRL(selectedRow.salario ?? 0)}
                            </span>
                          </div>
                          <div>
                            <span className={styles.factLabel}>Insalubridade</span>
                            <span className={styles.factValue}>
                              {toBRL(selectedRow.insalubridade ?? 0)}
                            </span>
                          </div>
                          <div>
                            <span className={styles.factLabel}>VR unit.</span>
                            <span className={styles.factValue}>{toBRL(selectedRow.vr ?? 0)}</span>
                          </div>
                          <div>
                            <span className={styles.factLabel}>Custo Total</span>
                            <span className={`${styles.factValue} ${styles.factHighlight}`}>
                              {toBRL(selectedRow.custo_total ?? 0)}
                            </span>
                          </div>
                        </div>

                        {(selectedRow.observacao_motivo || selectedRow.observacao) && (
                          <div className={styles.notesList}>
                            {selectedRow.observacao_motivo && (
                              <div className={styles.reviewNote}>
                                <strong>Obs. da vaga:</strong> {selectedRow.observacao_motivo}
                              </div>
                            )}
                            {selectedRow.observacao && (
                              <div className={styles.reviewNote}>
                                <strong>Obs. da remuneração:</strong> {selectedRow.observacao}
                              </div>
                            )}
                          </div>
                        )}

                        {isApprover ? (
                          <>
                            <div>
                              <p className={styles.decisionLabel}>Decisão</p>
                              <div className={styles.decisionRow}>
                                {SITUACOES_VAGA.map((situacao) => (
                                  <button
                                    key={situacao}
                                    type="button"
                                    className={`${styles.decisionBtn} ${
                                      styles[`decision_${situacao}`]
                                    } ${painelSituacao === situacao ? styles.decisionSelected : ''}`}
                                    onClick={() => setPainelSituacao(situacao)}
                                  >
                                    {situacao === 'aprovado' && <LuCheck size={14} />}
                                    {situacao === 'reprovado' && <LuX size={14} />}
                                    {situacao === 'pendente' && <LuClock size={14} />}
                                    {SITUACAO_LABEL[situacao]}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              label="Observação (opcional)"
                              placeholder="Ex.: aprovado, mas peço para ajustar o salário..."
                              value={painelObs}
                              onChange={(e) => setPainelObs(e.target.value)}
                            />
                            <div className={styles.formActions}>
                              <Button
                                variant="primary"
                                onClick={confirmarDecisaoPainel}
                                disabled={salvandoPainel}
                              >
                                {salvandoPainel ? 'Salvando...' : 'Confirmar decisão'}
                              </Button>
                            </div>
                          </>
                        ) : (
                          (can('pode_editar') || can('pode_deletar')) && (
                            <div className={styles.formActionsWithDelete}>
                              {can('pode_deletar') && (
                                <PermissionButton
                                  acao="pode_deletar"
                                  variant="danger"
                                  onClick={() => {
                                    setEditingId(selectedRow.id);
                                    openDeleteDialog();
                                  }}
                                >
                                  Excluir
                                </PermissionButton>
                              )}
                              <div className={styles.formActionsMain}>
                                {can('pode_editar') && (
                                  <Button
                                    variant="primary"
                                    onClick={() => abrirEdicaoModal(selectedRow)}
                                  >
                                    Editar Solicitação
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </>
                    ) : (
                      <div className={styles.mobileEmpty}>
                        Selecione uma solicitação para ver os detalhes.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.mobileList}>
                {rows.length === 0 ? (
                  <div className={styles.mobileEmpty}>Nenhuma solicitação encontrada.</div>
                ) : (
                  rows.map((row) => {
                    const podeAbrir = can('pode_editar') || can('pode_deletar');
                    const emDecisao = decisaoRapida?.id === row.id;
                    return (
                      <div
                        key={row.id}
                        className={`${styles.mobileCard} ${podeAbrir && !emDecisao ? styles.mobileCardClickable : ''}`}
                        onClick={podeAbrir && !emDecisao ? () => abrirEdicaoModal(row) : undefined}
                      >
                        <div className={styles.mobileCardHeader}>
                          <div className={styles.mobileField}>
                            <span className={styles.mobileFieldValue}>
                              {dateFormatter(row.data_solicitacao)}
                            </span>
                          </div>
                          <SituacaoChip situacao={row.situacao} />
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

                        {isApprover && row.situacao === 'pendente' && !emDecisao && (
                          <div className={styles.quickActions}>
                            <button
                              type="button"
                              className={`${styles.quickBtn} ${styles.quickApprove}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDecisaoRapida(row, 'aprovado');
                              }}
                            >
                              <LuCheck size={13} /> Aprovar
                            </button>
                            <button
                              type="button"
                              className={`${styles.quickBtn} ${styles.quickReject}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDecisaoRapida(row, 'reprovado');
                              }}
                            >
                              <LuX size={13} /> Reprovar
                            </button>
                          </div>
                        )}

                        {emDecisao && decisaoRapida && (
                          <div className={styles.quickExpand} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.quickExpandHead}>
                              {decisaoRapida.situacao === 'aprovado' ? (
                                <span className={`${styles.decisionLabel} ${styles.decision_aprovado}`}>
                                  <LuCheck size={14} /> Aprovando
                                </span>
                              ) : (
                                <span className={`${styles.decisionLabel} ${styles.decision_reprovado}`}>
                                  <LuX size={14} /> Reprovando
                                </span>
                              )}
                            </div>
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              placeholder={
                                decisaoRapida.situacao === 'aprovado'
                                  ? 'Ex.: aprovado, mas peço para ajustar o salário...'
                                  : 'Ex.: motivo da reprovação...'
                              }
                              value={obsRapida}
                              onChange={(e) => setObsRapida(e.target.value)}
                            />
                            <span className={styles.quickOptional}>Observação opcional</span>
                            <div className={styles.quickExpandActions}>
                              <Button
                                variant="secondary"
                                onClick={cancelarDecisaoRapida}
                                disabled={salvandoRapida}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="primary"
                                onClick={() => confirmarDecisaoRapida(row)}
                                disabled={salvandoRapida}
                              >
                                {salvandoRapida ? 'Salvando...' : 'Confirmar decisão'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
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
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              value={form.data_solicitacao}
              onChange={(e) => setField('data_solicitacao', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              sx={{ flex: 1, minWidth: 240 }}
              label="Solicitante"
              required
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              value={form.solicitante}
              onChange={(e) => setField('solicitante', e.target.value)}
            />
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={setores}
              getOptionKey={(f) => f.id}
              getOptionLabel={(f) => f.nome}
              value={setores.find((f) => f.id === form.id_setor) ?? null}
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              onChange={(_, v) => setField('id_setor', v?.id ?? '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => <TextField {...params} label="Setor" required />}
            />
          </div>

          <p className={styles.sectionTitle}>Vaga</p>
          <hr className={styles.divider} />
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 2, minWidth: 240 }}
              label="Cargo / Vaga"
              required
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              value={form.cargo_vaga}
              onChange={(e) => setField('cargo_vaga', e.target.value)}
            />
            <TextField
              sx={{ flex: 1, minWidth: 100 }}
              label="Qtd"
              type="number"
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              slotProps={{ htmlInput: { min: 1 } }}
              value={form.quantidade}
              onChange={(e) => setField('quantidade', Math.max(1, Number(e.target.value)))}
            />
            <FormControl sx={{ flex: 1, minWidth: 180 }}>
              <InputLabel>Tipo de Vaga</InputLabel>
              <Select
                value={form.tipo_vaga}
                label="Tipo de Vaga"
                disabled={canOnly('pode_editar', 'pode_visualizar')}
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
              label="Obs. Vaga"
              multiline
              disabled={canOnly('pode_editar', 'pode_visualizar')}
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
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.salario}
              onChange={(e) =>
                setField(
                  'salario',
                  e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                )
              }
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="Insalubridade"
              type="number"
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.insalubridade}
              onChange={(e) =>
                setField(
                  'insalubridade',
                  e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                )
              }
            />
            <TextField
              sx={{ flex: 1, minWidth: 160 }}
              label="VR"
              type="number"
              disabled={canOnly('pode_editar', 'pode_visualizar')}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              value={form.vr}
              onChange={(e) =>
                setField('vr', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
              }
            />
          </div>
          <div className={styles.formRow}>
            <TextField
              sx={{ flex: 1, minWidth: 260 }}
              label="Obs. Remuneração"
              multiline
              disabled={canOnly('pode_editar', 'pode_visualizar')}
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
              <div className={styles.formRow}>
                <TextField
                  sx={{ flex: 1, minWidth: 260 }}
                  label="Obs. Situação"
                  multiline
                  minRows={2}
                  value={form.observacao_situacao}
                  onChange={(e) => setField('observacao_situacao', e.target.value)}
                />
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
