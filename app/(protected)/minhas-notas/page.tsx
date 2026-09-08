'use client';

import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import PageHeader from '@/components/Layout/PageLayout/PageHeader/PageHeader';
import PageContent from '@/components/Layout/PageLayout/PageContent/PageContent';
import TablePagination from '@/components/Ui/TablePagination/TablePagination';
import SearchFilterBar from '@/components/Ui/SearchFilterBar/SearchFilterBar';
import MesSeletor from '@/components/Ui/MesSeletor/MesSeletor';
import useDashboardDate from '@/hooks/useDashboardDate';
import { useDebounce } from '@/hooks/useDebouncer';
import { getMinhasNotas } from '@/services/portalVendedor/minhasNotas';
import { NotaFiscalVendedorProps } from './types';
import toBRL from '@/utils/toBRL';
import dateFormatter from '@/utils/dateFormatter';
import TIPO_CONTRATO_COLORS from '@/utils/tipoContratoColors';
import { GRUPO_LABEL_PEDIDO, GRUPO_COLOR_PEDIDO } from '@/utils/grupoPedidoClassificacao';
import styles from './styles.module.css';

const FILTROS_GRUPO = [
  {
    key: 'grupo_deducao',
    label: 'Status',
    options: [
      { value: 'G1', label: 'Cancelado' },
      { value: 'G2', label: 'Devolvido' },
      { value: 'G3', label: 'Recusado' },
      { value: 'G6', label: 'Refaturamento' },
      { value: 'LIQUIDO', label: 'Normal' },
    ],
  },
];

export default function MinhasNotas() {
  const [loading, setLoading] = useState(true);
  const [vinculado, setVinculado] = useState(true);
  const [rows, setRows] = useState<NotaFiscalVendedorProps[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 500);
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const { completeDate } = useDashboardDate();

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const resposta = await getMinhasNotas({
          page: page + 1,
          limit: rowsPerPage,
          numero_nf: search || undefined,
          data_inicio: completeDate.startOf('month').format('YYYY-MM-DD'),
          data_fim: completeDate.endOf('month').format('YYYY-MM-DD'),
          grupo_deducao: grupoFiltro || undefined,
        });
        setVinculado(resposta.vinculado);
        setRows(resposta.data ?? []);
        setRowCount(resposta.total ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [page, rowsPerPage, search, grupoFiltro, completeDate]);

  return (
    <div className={styles.pageGlow}>
      <div className={styles.pageHeaderRow}>
        <PageHeader
          title="Minhas Notas Fiscais"
          subtitle="Suas notas fiscais de saída no mês selecionado"
        />
        <MesSeletor />
      </div>
      <PageContent>
        {!vinculado ? (
          <div className={styles.emptyState}>
            <p>
              Seu usuário ainda não está vinculado a um vendedor. Fale com o time de acessos para
              configurar esse vínculo.
            </p>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <SearchFilterBar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                setPage(0);
              }}
              searchPlaceholder="Buscar por número da nota..."
              filters={FILTROS_GRUPO}
              activeValues={{ grupo_deducao: grupoFiltro || undefined }}
              onFilterChange={(key, value) => {
                if (key === 'grupo_deducao') {
                  setGrupoFiltro(value ?? '');
                  setPage(0);
                }
              }}
              glass
            />
            {loading ? (
              <div className={styles.loading}>
                <CircularProgress size={50} />
                <span>Carregando...</span>
              </div>
            ) : rows.length === 0 ? (
              <p className={styles.emptyList}>Nenhuma nota fiscal encontrada neste mês.</p>
            ) : (
              <div className={styles.listWrapper}>
                {rows.map((nota) => {
                  const grupo =
                    nota.grupo_deducao && nota.grupo_deducao !== 'LIQUIDO' ? nota.grupo_deducao : null;
                  return (
                    <div key={nota.numero_nf} className={styles.nfCard}>
                      <div className={styles.nfTop}>
                        <div className={styles.nfIcon}>NF</div>
                        <div>
                          <div className={styles.nfNumber}>Nota {nota.numero_nf}</div>
                          {nota.numero_pedido && (
                            <span className={styles.nfOrderLink}>↳ Pedido nº {nota.numero_pedido}</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.nfValues}>
                        <div className={styles.nfTotal}>{toBRL(nota.valor_nf)}</div>
                        <div className={styles.nfBreakdown}>
                          mercadorias {toBRL(nota.valor_mercadorias)}
                        </div>
                      </div>
                      <div className={styles.nfBottom}>
                        <span className={styles.nfDate}>
                          {nota.destinatario ?? '—'}
                          {nota.data_emissao ? ` · emitida em ${dateFormatter(nota.data_emissao)}` : ''}
                        </span>
                        <div className={styles.badges}>
                          <span
                            className={styles.badge}
                            style={{
                              backgroundColor: TIPO_CONTRATO_COLORS[nota.tipo_contrato ?? 'SEM CLASSIFICAÇÃO'],
                              color: 'var(--white)',
                            }}
                          >
                            {nota.tipo_contrato ?? 'SEM CLASSIFICAÇÃO'}
                          </span>
                          {grupo && (
                            <span
                              className={styles.badge}
                              style={{ backgroundColor: GRUPO_COLOR_PEDIDO[grupo], color: 'var(--white)' }}
                            >
                              {GRUPO_LABEL_PEDIDO[grupo]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
        )}
      </PageContent>
    </div>
  );
}
