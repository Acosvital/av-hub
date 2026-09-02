'use client';

import { Fragment, useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu';
import styles from './TablePagination.module.css';

interface TablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
  labelRowsPerPage?: string;
}

export default function TablePagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
  labelRowsPerPage = 'Resultados por página',
}: TablePaginationProps) {
  const [gotoValue, setGotoValue] = useState('');

  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count, (page + 1) * rowsPerPage);

  const goToPage = (target: number) => {
    onPageChange(Math.max(0, Math.min(totalPages - 1, target)));
  };

  const pageSet = new Set<number>([0, totalPages - 1]);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 0 && p < totalPages - 1) pageSet.add(p);
  }
  const pages = [...pageSet].sort((a, b) => a - b);

  const submitGoto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const value = parseInt(gotoValue, 10);
    if (!Number.isNaN(value)) goToPage(value - 1);
    setGotoValue('');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.left}>
        <div className={styles.rppGroup}>
          <label htmlFor="rows-per-page" className={styles.rppLabel}>
            {labelRowsPerPage}
          </label>
          <select
            id="rows-per-page"
            className={styles.rppSelect}
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(+e.target.value)}
          >
            {rowsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <span className={styles.count}>
          {from.toLocaleString('pt-BR')}–{to.toLocaleString('pt-BR')} de{' '}
          <strong>{count.toLocaleString('pt-BR')}</strong>
        </span>
      </div>

      {totalPages > 1 && (
        <div className={styles.right}>
          <button
            type="button"
            className={styles.pill}
            aria-label="Primeira página"
            disabled={page === 0}
            onClick={() => goToPage(0)}
          >
            <LuChevronsLeft size={14} />
          </button>
          <button
            type="button"
            className={styles.pill}
            aria-label="Página anterior"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
          >
            <LuChevronLeft size={14} />
          </button>

          {pages.map((p, i) => {
            const prev = pages[i - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;
            return (
              <Fragment key={p}>
                {showEllipsis && (
                  <span className={`${styles.pill} ${styles.ellipsis}`} aria-hidden="true">
                    …
                  </span>
                )}
                <button
                  type="button"
                  className={`${styles.pill} ${p === page ? styles.current : ''}`}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => goToPage(p)}
                >
                  {p + 1}
                </button>
              </Fragment>
            );
          })}

          <button
            type="button"
            className={styles.pill}
            aria-label="Próxima página"
            disabled={page >= totalPages - 1}
            onClick={() => goToPage(page + 1)}
          >
            <LuChevronRight size={14} />
          </button>
          <button
            type="button"
            className={styles.pill}
            aria-label="Última página"
            disabled={page >= totalPages - 1}
            onClick={() => goToPage(totalPages - 1)}
          >
            <LuChevronsRight size={14} />
          </button>

          {totalPages > 8 && (
            <div className={styles.gotoWrap}>
              <label htmlFor="goto-page" className={styles.gotoLabel}>
                Ir para
              </label>
              <input
                id="goto-page"
                type="number"
                className={styles.gotoInput}
                min={1}
                max={totalPages}
                placeholder={String(page + 1)}
                value={gotoValue}
                onChange={(e) => setGotoValue(e.target.value)}
                onKeyDown={submitGoto}
              />
              <span className={styles.gotoTotal}>de {totalPages.toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
