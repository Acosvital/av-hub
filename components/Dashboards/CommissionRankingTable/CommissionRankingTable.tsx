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

const CommissionRankingTable = ({ vendors, managers }: CommissionRankingTableProps) => {
  const [activeTab, setActiveTab] = useState<'vendedores' | 'gerencia'>('vendedores');
  const rows = activeTab === 'vendedores' ? vendors : managers;

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
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rankCol}>Rank</th>
              <th className={styles.nameCol}>Nome do Vendedor</th>
              <th>Faturado</th>
              <th>A Faturar</th>
              <th>Ajuda Custo</th>
              <th>Comissão</th>
              <th>Bloqueado</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td className={styles.rankCol}>
                  <RankingBadge rank={row.rank} />
                </td>
                <td className={styles.nameCol}>{row.name}</td>
                <td className={styles.faturado}>{formatValue(row.faturado)}</td>
                <td className={styles.aFaturar}>{formatValue(row.aFaturar)}</td>
                <td className={styles.ajudaCusto}>{toBRL(row.ajudaCusto)}</td>
                <td className={styles.comissao}>{formatValue(row.comissao)}</td>
                <td className={styles.bloqueado}>{formatValue(row.bloqueado)}</td>
                <td className={styles.total}>{toBRL(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionRankingTable;
