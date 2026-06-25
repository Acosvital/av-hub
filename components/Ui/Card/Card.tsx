'use client';
import clsx from 'clsx';
import styles from './Card.module.css';
import Button from '../Button/Button';
import { FaFileDownload } from 'react-icons/fa';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  height?: 'fit' | 'full';
  download?: () => void;
  create?: () => void;
}

export default function Card({
  children,
  title,
  className,
  download,
  create,
  height = 'full',
}: CardProps) {
  const cardHeight = height === 'fit' ? styles.fit : styles.full;
  return (
    <div className={clsx(styles.card, cardHeight, className)}>
      <div className={styles.titleContainer}>
        {title && <h2 className={styles.cardTitle}>{title}</h2>}
        <div>
          {download && (
            <Button variant="primary" onClick={download} icon={<FaFileDownload size={18} />}>
              Exportar
            </Button>
          )}
          {create && (
            <Button variant="primary" onClick={create} icon={<FaFileDownload size={18} />}>
              Novo
            </Button>
          )}
        </div>
      </div>
      <div className={styles.contentContainer}>{children}</div>
    </div>
  );
}
