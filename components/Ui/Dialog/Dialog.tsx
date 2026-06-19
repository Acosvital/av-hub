import { useEffect } from "react";
import Button from "../Button/Button";
import styles from './Dialog.module.css';

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmLabel?: string;
  loadingLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

const Dialog = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  isLoading = false,
  confirmLabel = 'Confirmar',
  loadingLabel,
  confirmVariant = 'danger',
}: DialogProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedLoadingLabel = loadingLabel ?? `${confirmLabel.replace(/r$/, 'ndo')}...`;

  return (
    <div className={styles.dialogContainer}>
      <div className={styles.dialog}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.dialogButtons}>
          <Button variant='secondary' onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? resolvedLoadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
