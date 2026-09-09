import { ReactNode, useEffect, useRef } from 'react';
import styles from './Modal.module.css';
import { IoMdClose } from 'react-icons/io';

interface ModalProps {
  // 'glass' = vidro fosco (fundo transparente, sem padding próprio, header
  // também vira vidro) — variante opt-in, só quem passar type="glass" muda;
  // todo o resto do app continua com o .modalCard sólido de sempre.
  type?: 'primary' | 'secondary' | 'glass';
  title?: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  // Classe extra pro .modalCard — usada pelo VendorDetailsModal pra aplicar
  // a largura e o brilho radial (dourado/verde) específicos dele, sem
  // acoplar essas cores ao Modal compartilhado.
  cardClassName?: string;
}

const Modal = ({
  type = 'primary',
  title,
  subtitle,
  isOpen,
  onClose,
  children,
  cardClassName,
  ...props
}: ModalProps) => {
  const mouseDownTarget = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div
      className={`${styles.modalContainer} ${type === 'glass' ? styles.glassContainer : ''}`}
      role="dialog"
      aria-modal="true"
      {...props}
      onMouseDown={(e) => {
        mouseDownTarget.current = e.target;
      }}
      onClick={(e) => {
        if (mouseDownTarget.current === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.modalCard} ${type === 'secondary' ? styles.backgroundSecondary : ''} ${type === 'glass' ? styles.glass : ''} ${cardClassName ?? ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderText}>
            {title && <h2 className={styles.modalTitle}>{title}</h2>}
            {subtitle && <h3 className={styles.modalSubTitle}>{subtitle}</h3>}
          </div>
          <IoMdClose className={styles.modalClose} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
