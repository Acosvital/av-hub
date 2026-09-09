'use client';
import { useState } from 'react';
import { FaUsers } from 'react-icons/fa';
import styles from './CommissionRankingTable.module.css';
import toBRL from '@/utils/toBRL';
import RankingBadge from '@/components/Dashboards/VendorCard/RankingBadge/RankingBadge';
import Avatar from '@/components/Layout/AppLayout/Header/Avatar/Avatar';
import { nomeExibicaoResumido } from '@/utils/nomeExibicao';

export interface CommissionRow {
  rank: number;
  name: string;
  faturado: number;
  aFaturar: number;
  ajudaCusto: number;
  comissao: number;
  bloqueado: number;
  total: number;
}

interface CommissionRankingTableProps {
  vendors: CommissionRow[];
  managers: CommissionRow[];
  onRowClick?: (row: CommissionRow) => void;
}

const formatValue = (value: number) => (value > 0 ? toBRL(value) : '0');

// Borda colorida por posição (ouro/prata/bronze) — só o top 3, nas duas
// abas (Vendedores e Gerência), mesma cor do selo de RankingBadge.
const RANK_BORDER_CLASS: Record<number, string> = {
  1: 'borderGold',
  2: 'borderSilver',
  3: 'borderBronze',
};

// Mesmo visual do Ranking de Vendas (VendorCard: selo de posição + avatar +
// nome à esquerda, Total em destaque à direita) — adaptado pros campos de
// comissão, que não têm o conceito de "% da meta"/"% de participação" que o
// VendorCard usa (por isso não reaproveita o componente direto, só o
// layout). Card único pra qualquer largura de tela — sem grade de colunas
// fixas, que cortava a coluna "Total" em telas de notebook.
const CommissionCard = ({
  row,
  onRowClick,
  grayBorder,
}: {
  row: CommissionRow;
  onRowClick?: (row: CommissionRow) => void;
  grayBorder?: boolean;
}) => {
  const nomeExibicao = nomeExibicaoResumido(row.name);
  const borderClass = grayBorder ? styles.borderGray : (styles[RANK_BORDER_CLASS[row.rank]] ?? '');
  return (
    <div
      className={`${styles.commissionCard} ${borderClass} ${onRowClick ? styles.clickable : ''}`}
      onClick={() => onRowClick?.(row)}
    >
      <div className={styles.commissionRank}>
        <RankingBadge rank={row.rank} />
        <Avatar name={nomeExibicao} size={38} />
      </div>
      <div className={styles.commissionBody}>
        <div className={styles.commissionTopRow}>
          <h4 className={styles.commissionName}>{nomeExibicao}</h4>
          <div className={styles.commissionTotalCol}>
            <span className={styles.commissionTotalLabel}>Total</span>
            <span className={styles.commissionTotalValue}>{toBRL(row.total)}</span>
          </div>
        </div>
        <div className={styles.commissionStatsRow}>
          <div className={styles.commissionStat}>
            <span className={styles.statLabel}>Faturado</span>
            <span className={`${styles.statValue} ${styles.faturado}`}>
              {formatValue(row.faturado)}
            </span>
          </div>
          <div className={styles.commissionStat}>
            <span className={styles.statLabel}>A Faturar</span>
            <span className={`${styles.statValue} ${styles.aFaturar}`}>
              {formatValue(row.aFaturar)}
            </span>
          </div>
          <div className={styles.commissionStat}>
            <span className={styles.statLabel}>Ajuda Custo</span>
            <span className={`${styles.statValue} ${styles.ajudaCusto}`}>
              {toBRL(row.ajudaCusto)}
            </span>
          </div>
          <div className={styles.commissionStat}>
            <span className={styles.statLabel}>Comissão</span>
            <span className={`${styles.statValue} ${styles.comissao}`}>
              {formatValue(row.comissao)}
            </span>
          </div>
          <div className={styles.commissionStat}>
            <span className={styles.statLabel}>Bloqueado</span>
            <span className={`${styles.statValue} ${styles.bloqueado}`}>
              {formatValue(row.bloqueado)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommissionRankingTable = ({ vendors, managers, onRowClick }: CommissionRankingTableProps) => {
  const [activeTab, setActiveTab] = useState<'vendedores' | 'gerencia'>('vendedores');
  const rows = activeTab === 'vendedores' ? vendors : managers;
  const top3 = rows.slice(0, 3);
  const otherRows = rows.slice(3);
  const scrollDuration = `${otherRows.length * 1.7}s`;
  // Gerência tem poucos nomes (não passa de um punhado) — o pódio "flutuante"
  // + a lista rolando sozinha (pensados pra dúzias de vendedores) ficavam
  // sem sentido e pareciam quebrados com tão pouca gente. Pedido do Nathan:
  // pra Gerência, mostra todo mundo junto, parado, sem esse destaque/scroll.
  const isGerencia = activeTab === 'gerencia';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <FaUsers size={16} />
          <span>Ranking</span>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'vendedores' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('vendedores')}
          >
            Vendedores
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'gerencia' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('gerencia')}
          >
            Gerência
          </button>
        </div>
      </div>

      {isGerencia ? (
        <div className={styles.staticSection}>
          <div className={styles.rowGroup}>
            {rows.map((row) => (
              <CommissionCard key={row.rank} row={row} onRowClick={onRowClick} grayBorder />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.fixedSection}>
            Destaques do Pódio
            <div className={styles.top3Container}>
              {top3.map((row) => (
                <CommissionCard key={row.rank} row={row} onRowClick={onRowClick} />
              ))}
            </div>
          </div>

          <div className={styles.scrollSection}>
            <div
              className={otherRows.length > 6 ? styles.autoScroll : ''}
              style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
            >
              <div className={styles.rowGroup}>
                {otherRows.map((row) => (
                  <CommissionCard key={row.rank} row={row} onRowClick={onRowClick} />
                ))}
              </div>
              <div className={styles.rowGroup} aria-hidden="true">
                {otherRows.length > 6 &&
                  otherRows.map((row) => (
                    <CommissionCard key={`${row.rank}-clone`} row={row} onRowClick={onRowClick} />
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommissionRankingTable;
