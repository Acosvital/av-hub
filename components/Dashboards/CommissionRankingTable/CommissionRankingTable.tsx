'use client';
import { useState } from 'react';
import { FaUsers } from 'react-icons/fa';
import styles from './CommissionRankingTable.module.css';
import toBRL from '@/utils/toBRL';
import RankingBadge from '@/components/Dashboards/VendorCard/RankingBadge/RankingBadge';

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
}

const formatValue = (value: number) => (value > 0 ? toBRL(value) : '0');

const Row = ({ row }: { row: CommissionRow }) => (
  <div className={styles.gridRow} onClick={() => console.log(row)}>
    <div className={styles.rankCol}><RankingBadge rank={row.rank} /></div>
    <div className={styles.nameCol}>{row.name}</div>
    <div className={styles.faturado}>{formatValue(row.faturado)}</div>
    <div className={styles.aFaturar}>{formatValue(row.aFaturar)}</div>
    <div className={styles.ajudaCusto}>{toBRL(row.ajudaCusto)}</div>
    <div className={styles.comissao}>{formatValue(row.comissao)}</div>
    <div className={styles.bloqueado}>{formatValue(row.bloqueado)}</div>
    <div className={styles.total}>{toBRL(row.total)}</div>
  </div>
);

const MobileCard = ({ row }: { row: CommissionRow }) => (
  <div className={styles.mobileCard}>
    <div className={styles.mobileCardHeader}>
      <RankingBadge rank={row.rank} />
      <span className={styles.mobileCardName}>{row.name}</span>
    </div>
    <div className={styles.mobileCardBody}>
      <div className={styles.mobileField}>
        <span className={styles.mobileFieldLabel}>Faturado</span>
        <span className={`${styles.mobileFieldValue} ${styles.faturado}`}>{formatValue(row.faturado)}</span>
      </div>
      <div className={styles.mobileField}>
        <span className={styles.mobileFieldLabel}>A Faturar</span>
        <span className={`${styles.mobileFieldValue} ${styles.aFaturar}`}>{formatValue(row.aFaturar)}</span>
      </div>
      <div className={styles.mobileField}>
        <span className={styles.mobileFieldLabel}>Comissão</span>
        <span className={`${styles.mobileFieldValue} ${styles.comissao}`}>{formatValue(row.comissao)}</span>
      </div>
      <div className={styles.mobileField}>
        <span className={styles.mobileFieldLabel}>Bloqueado</span>
        <span className={`${styles.mobileFieldValue} ${styles.bloqueado}`}>{formatValue(row.bloqueado)}</span>
      </div>
      <div className={`${styles.mobileField} ${styles.mobileFieldFull}`}>
        <span className={styles.mobileFieldLabel}>Ajuda de Custo</span>
        <span className={`${styles.mobileFieldValue} ${styles.ajudaCusto}`}>{toBRL(row.ajudaCusto)}</span>
      </div>
      <div className={`${styles.mobileField} ${styles.mobileFieldFull} ${styles.mobileFieldTotal}`}>
        <span className={styles.mobileFieldLabel}>Total</span>
        <span className={`${styles.mobileFieldValue} ${styles.total}`}>{toBRL(row.total)}</span>
      </div>
    </div>
  </div>
);

const CommissionRankingTable = ({ vendors, managers }: CommissionRankingTableProps) => {
  const [activeTab, setActiveTab] = useState<'vendedores' | 'gerencia'>('vendedores');
  const rows = activeTab === 'vendedores' ? vendors : managers;
  const top3 = rows.slice(0, 3);
  const otherRows = rows.slice(3);
  const scrollDuration = `${otherRows.length * 1.7}s`;

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
      <div className={styles.largeScreen}>
        <div className={`${styles.gridRow} ${styles.tableHead}`}>
          <div className={styles.rankCol}>Rank</div>
          <div className={styles.nameCol}>Nome do Vendedor</div>
          <div>Faturado</div>
          <div>A Faturar</div>
          <div>Ajuda Custo</div>
          <div>Comissão</div>
          <div>Bloqueado</div>
          <div>Total</div>
        </div>

        <div className={styles.fixedSection}>
          {top3.map((row) => <Row key={row.rank} row={row} />)}
        </div>

        <div className={styles.scrollSection}>
          <div
            className={otherRows.length > 6 ? styles.autoScroll : ''}
            style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
          >
            <div className={styles.rowGroup}>
              {otherRows.map((row) => <Row key={row.rank} row={row} />)}
            </div>
            <div className={styles.rowGroup} aria-hidden="true">
              {otherRows.length > 6 && otherRows.map((row) => (
                <Row key={`${row.rank}-clone`} row={row} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.mobile}>
        {rows.map((row) => <MobileCard key={row.rank} row={row} />)}
      </div>
    </div>
  );
};

export default CommissionRankingTable;
