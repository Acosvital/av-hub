'use client';

import { FaPen } from 'react-icons/fa6';
import Gauge from '@/components/Charts/Gauge/Gauge';
import toBRL from '@/utils/toBRL';
import toCompactBRL from '@/utils/toCompactBRL';
import { MESES_LABEL } from '@/app/(protected)/fechamento/types';
import styles from './MonthGaugeCard.module.css';

interface MonthGaugeCardProps {
  mes: number;
  ano: number;
  valorTotal: number | null;
  meta: number | null;
  onEdit?: () => void;
  // Mesma cor do gauge do dashboard de origem (verde+degradê azul em
  // Vendas, dourado sólido em Faturamento) — não varia por atingimento,
  // pra bater exatamente com a identidade visual de cada tela.
  color: string;
  gradientColor?: string;
}

const MonthGaugeCard = ({
  mes,
  ano,
  valorTotal,
  meta,
  onEdit,
  color,
  gradientColor,
}: MonthGaugeCardProps) => {
  const preenchido = valorTotal !== null;
  const pct = preenchido && meta ? (valorTotal / meta) * 100 : 0;

  return (
    <div className={`${styles.card} ${!preenchido ? styles.cardVazio : ''}`}>
      <div className={styles.header}>
        <span className={styles.mes}>{MESES_LABEL[mes]}</span>
        <span className={styles.ano}>{ano}</span>
        {onEdit && (
          <button type="button" className={styles.editBtn} onClick={onEdit} aria-label="Editar fechamento">
            <FaPen size={11} />
          </button>
        )}
      </div>

      {preenchido ? (
        <>
          <Gauge size={168} value={Math.max(pct, 0)} color={color} gradientFrom={gradientColor} />
          <div className={styles.values}>
            <span className={styles.valorTotal}>{toBRL(valorTotal)}</span>
            {meta ? <span className={styles.meta}>Meta {toCompactBRL(meta)}</span> : null}
          </div>
        </>
      ) : (
        <button type="button" className={styles.vazioAction} onClick={onEdit} disabled={!onEdit}>
          <span className={styles.vazioIcone}>+</span>
          <span>Lançar fechamento</span>
        </button>
      )}
    </div>
  );
};

export default MonthGaugeCard;
