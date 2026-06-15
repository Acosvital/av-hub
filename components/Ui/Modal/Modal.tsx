import { ReactNode, useEffect } from "react"
import styles from './Modal.module.css';
import { IoMdClose } from "react-icons/io";

interface ModalProps {
  type?: 'primary' | 'secondary';
  title?: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode
}

const Modal = ({ type = 'primary', title, subtitle, isOpen, onClose, children, ...props }: ModalProps) => {

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
      className={`${styles.modalContainer}`}
      role="dialog"
      aria-modal="true"
      {...props}
      onClick={onClose}
    >
      <div className={`${styles.modalCard} ${type === 'secondary' && styles.backgroundSecondary}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            {title && <h2 className={styles.modalTitle}>{title}</h2>}
            {subtitle && <h3 className={styles.modalSubTitle}>{subtitle}</h3>}
          </div>
          <IoMdClose onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal;