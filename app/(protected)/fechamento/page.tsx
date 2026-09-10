'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CircularProgress, TextField } from '@mui/material';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import MonthGaugeCard from '@/components/Dashboards/MonthGaugeCard/MonthGaugeCard';
import { usePermission } from '@/hooks/usePermission';
import { notify } from '@/lib/toast/toast';
import { getMetasMensais } from '@/services/cadastros/auxiliares/metasMensais';
import { getVendaMensal } from '@/services/dashboards/dashboardVendas';
import { getFaturamentoMensal } from '@/services/dashboards/dashboardFaturamento';
import { getFechamentoManual, salvarFechamentoManual } from '@/services/fechamento/fechamentoManual';
import { ehAutomatico, FechamentoMesProps, MESES_LABEL, TipoFechamento } from './types';
import styles from './styles.module.css';

const ANO_BASE = 2026;

// Jan/2026 até o mês corrente (real, do relógio do cliente) — cresce
// sozinho mês a mês, sem precisar mexer em código.
function gerarMeses(): { mes: number; ano: number }[] {
  const fim = dayjs();
  let cursor = dayjs(`${ANO_BASE}-01-01`);
  const meses: { mes: number; ano: number }[] = [];
  while (cursor.isBefore(fim, 'month') || cursor.isSame(fim, 'month')) {
    meses.push({ mes: cursor.month() + 1, ano: cursor.year() });
    cursor = cursor.add(1, 'month');
  }
  return meses;
}

export default function Fechamento() {
  const { can } = usePermission();
  const [tab, setTab] = useState<TipoFechamento>('venda');
  const [loading, setLoading] = useState(true);
  const [meses, setMeses] = useState<FechamentoMesProps[]>([]);
  const [editando, setEditando] = useState<{ mes: number; ano: number } | null>(null);
  const [valorInput, setValorInput] = useState('');
  const [salvando, setSalvando] = useState(false);

  const listaMeses = useMemo(gerarMeses, []);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const automaticos = listaMeses.filter((m) => ehAutomatico(m.mes, m.ano));

        const [metasRes, fechamentoRes, ...automaticosRes] = await Promise.allSettled([
          getMetasMensais({ ano: ANO_BASE, tipo: tab, limit: 100 }),
          getFechamentoManual({ ano: ANO_BASE, tipo: tab }),
          ...automaticos.map((m) =>
            tab === 'venda'
              ? getVendaMensal({ mes: m.mes, ano: m.ano })
              : getFaturamentoMensal({ mes: m.mes, ano: m.ano })
          ),
        ]);

        const metaPorMes = new Map<number, number>();
        if (metasRes.status === 'fulfilled') {
          (metasRes.value.metas_mensais ?? []).forEach((m) => metaPorMes.set(m.mes, Number(m.meta)));
        } else {
          console.error(metasRes.reason);
        }

        const manualPorMes = new Map<number, number>();
        if (fechamentoRes.status === 'fulfilled') {
          (fechamentoRes.value.fechamento_manual ?? []).forEach((f) =>
            manualPorMes.set(f.mes, Number(f.valor_total))
          );
        }
        // 404/500 aqui é esperado até a tabela existir no backend (ver
        // docs/ENVIAR - contrato-fechamento-manual.md) — mês fica "sem
        // lançamento" em vez de quebrar a tela.

        const resolvidos: FechamentoMesProps[] = listaMeses.map((m) => {
          if (!ehAutomatico(m.mes, m.ano)) {
            const valor = manualPorMes.get(m.mes) ?? null;
            return {
              mes: m.mes,
              ano: m.ano,
              automatico: false,
              valorTotal: valor,
              meta: metaPorMes.get(m.mes) ?? null,
              preenchido: valor !== null,
            };
          }

          const posAuto = automaticos.findIndex((a) => a.mes === m.mes && a.ano === m.ano);
          const resultado = automaticosRes[posAuto];
          let total: number | null = null;
          let meta = metaPorMes.get(m.mes) ?? null;
          if (resultado?.status === 'fulfilled') {
            const linha = resultado.value.consolidado ?? resultado.value.data?.[0] ?? null;
            if (linha) {
              const valorMes = 'vendas_total' in linha ? linha.vendas_total : linha.faturamento_total;
              total = Number(valorMes) || 0;
              meta = Number(linha.meta) || meta;
            }
          } else if (resultado) {
            console.error(resultado.reason);
          }

          // Sobrescrita manual (correção pontual) tem prioridade sobre o
          // valor automático — mesmo num mês "automático", se existe um
          // lançamento manual salvo pra esse mês, é ele que aparece.
          const sobrescrita = manualPorMes.get(m.mes);
          const valorFinal = sobrescrita !== undefined ? sobrescrita : total;

          return {
            mes: m.mes,
            ano: m.ano,
            automatico: true,
            valorTotal: valorFinal,
            meta,
            preenchido: valorFinal !== null,
          };
        });

        setMeses(resolvidos);
      } catch (err) {
        console.error(err);
        notify.error('Erro ao carregar fechamento');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [tab, listaMeses]);

  function abrirEdicao(mes: number, ano: number, valorAtual: number | null) {
    setEditando({ mes, ano });
    setValorInput(valorAtual !== null ? String(valorAtual) : '');
  }

  async function salvar() {
    if (!editando) return;
    const valor = Number(valorInput.replace(',', '.'));
    if (!valorInput || Number.isNaN(valor) || valor < 0) {
      notify.error('Informe um valor válido');
      return;
    }
    setSalvando(true);
    try {
      await salvarFechamentoManual({
        mes: editando.mes,
        ano: editando.ano,
        tipo: tab,
        valor_total: valor,
      });
      const { mes, ano } = editando;
      setMeses((prev) =>
        prev.map((m) => (m.mes === mes && m.ano === ano ? { ...m, valorTotal: valor, preenchido: true } : m))
      );
      notify.success('Fechamento salvo');
      setEditando(null);
    } catch (err) {
      console.error(err);
      notify.error('Erro ao salvar fechamento');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.pageGlow}>
      <PageHeader title="Fechamento" subtitle="Fechamento oficial de Vendas e Faturamento, mês a mês" />
      <PageContent>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'venda' ? styles.activeTab : ''}`}
            onClick={() => setTab('venda')}
          >
            Fechamento de Vendas
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'faturamento' ? styles.activeTab : ''}`}
            onClick={() => setTab('faturamento')}
          >
            Fechamento de Faturamento
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <CircularProgress size={44} />
          </div>
        ) : (
          <div className={styles.grid}>
            {meses.map((m) => (
              <MonthGaugeCard
                key={`${m.ano}-${m.mes}`}
                mes={m.mes}
                ano={m.ano}
                valorTotal={m.valorTotal}
                meta={m.meta}
                color={tab === 'venda' ? 'var(--green)' : 'var(--gold)'}
                gradientColor={tab === 'venda' ? 'var(--blue)' : undefined}
                // Mesmo mês "automático" pode ser sobrescrito manualmente
                // (ver carregar() acima — a sobrescrita, se existir, já
                // ganha do valor automático na hora de exibir).
                onEdit={can('pode_criar') ? () => abrirEdicao(m.mes, m.ano, m.valorTotal) : undefined}
              />
            ))}
          </div>
        )}
      </PageContent>

      <Modal
        isOpen={editando !== null}
        onClose={() => setEditando(null)}
        title={editando ? `${MESES_LABEL[editando.mes]} ${editando.ano}` : ''}
        subtitle={tab === 'venda' ? 'Fechamento de Vendas' : 'Fechamento de Faturamento'}
      >
        <div className={styles.modalBody}>
          <TextField
            label="Valor total fechado"
            value={valorInput}
            onChange={(e) => setValorInput(e.target.value)}
            placeholder="Ex.: 1500000.00"
            fullWidth
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
