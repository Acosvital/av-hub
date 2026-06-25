import { useState } from 'react';
import Dialog from '@/components/Ui/Dialog/Dialog';

interface UseDeleteDialogOptions {
  onConfirm: () => Promise<void> | void;
  message: string;
  title?: string;
  confirmLabel?: string;
}

export function useDeleteDialog({
  onConfirm,
  message,
  title = 'Confirmar Exclusão',
  confirmLabel = 'Excluir',
}: UseDeleteDialogOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDialog = () => setIsOpen(true);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      setIsOpen(false);
    } catch {
      // erro já tratado pelo chamador; mantém o dialog aberto
    } finally {
      setIsDeleting(false);
    }
  };

  const dialog = (
    <Dialog
      isOpen={isOpen}
      title={title}
      message={message}
      onClose={() => setIsOpen(false)}
      onConfirm={handleConfirm}
      isLoading={isDeleting}
      confirmLabel={confirmLabel}
      confirmVariant='danger'
    />
  );

  return { openDialog, dialog, isDeleting };
}
