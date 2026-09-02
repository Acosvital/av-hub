'use client';

import clsx from 'clsx';
import styles from './MobileCardList.module.css';

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
}

export interface MobileCardHighlight {
  label: string;
  value: React.ReactNode;
}

interface MobileCardListProps<T> {
  rows: T[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  onRowClick?: (row: T) => void;
  // Linha pequena acima do título — ex.: data. Só aparece se fornecida.
  renderMeta?: (row: T) => React.ReactNode;
  // Chip/selo no canto direito, ao lado do título — ex.: status.
  renderBadge?: (row: T) => React.ReactNode;
  renderTitle: (row: T) => React.ReactNode;
  renderSubtitle?: (row: T) => React.ReactNode;
  fields: (row: T) => MobileCardField[];
  renderHighlight?: (row: T) => MobileCardHighlight | null | undefined;
  renderActions?: (row: T) => React.ReactNode;
}

export default function MobileCardList<T>({
  rows,
  getRowKey,
  emptyMessage,
  onRowClick,
  renderMeta,
  renderBadge,
  renderTitle,
  renderSubtitle,
  fields,
  renderHighlight,
  renderActions,
}: MobileCardListProps<T>) {
  if (rows.length === 0) {
    return (
      <div className={styles.mobileList}>
        <div className={styles.mobileEmpty}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.mobileList}>
      {rows.map((row) => {
        const key = getRowKey(row);
        const highlight = renderHighlight?.(row);
        const meta = renderMeta?.(row);

        return (
          <div
            key={key}
            className={clsx(styles.mobileCard, onRowClick && styles.mobileCardClickable)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {meta && <div className={styles.mobileCardMeta}>{meta}</div>}

            <div className={styles.mobileCardTitleRow}>
              <span className={styles.mobileCardTitle}>{renderTitle(row)}</span>
              {renderBadge?.(row)}
            </div>
            {renderSubtitle && (
              <span className={styles.mobileCardSubtitle}>{renderSubtitle(row)}</span>
            )}

            <div className={styles.mobileCardBody}>
              {fields(row).map((field) => (
                <div className={styles.mobileField} key={field.label}>
                  <span className={styles.mobileFieldLabel}>{field.label}</span>
                  <span className={styles.mobileFieldValue}>{field.value}</span>
                </div>
              ))}
            </div>

            {highlight && (
              <div className={styles.mobileCardHighlight}>
                <span className={styles.mobileCardHighlightLabel}>{highlight.label}</span>
                <span className={styles.mobileCardHighlightValue}>{highlight.value}</span>
              </div>
            )}

            {renderActions && (
              <div className={styles.mobileCardActions} onClick={(e) => e.stopPropagation()}>
                {renderActions(row)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
