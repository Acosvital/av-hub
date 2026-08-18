'use client';

import { useState } from 'react';
import { TextField } from '@mui/material';
import Modal from '@/components/Ui/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import { notify } from '@/lib/toast/toast';
import { alterarSenha } from '@/services/cadastros/acessos/usuarios';
import styles from './AlterarSenhaModal.module.css';

interface AlterarSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  idUsuario: string;
}

export default function AlterarSenhaModal({ isOpen, onClose, idUsuario }: AlterarSenhaModalProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmacao('');
    onClose();
  };

  const handleSalvar = async () => {
    if (!senhaAtual.trim()) {
      notify.error('Informe a senha atual');
      return;
    }
    if (!novaSenha.trim()) {
      notify.error('Informe a nova senha');
      return;
    }
    if (novaSenha !== confirmacao) {
      notify.error('A confirmação não confere com a nova senha');
      return;
    }
    try {
      setSaving(true);
      await alterarSenha(idUsuario, { senha_atual: senhaAtual, senha_nova: novaSenha });
      notify.success('Senha alterada com sucesso');
      handleClose();
    } catch {
      notify.error('Senha atual incorreta ou erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Alterar Senha"
      subtitle="Preencha os campos abaixo para alterar sua senha"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <div className={styles.form}>
        <TextField
          fullWidth
          label="Senha atual"
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
        <TextField
          fullWidth
          label="Nova senha"
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <TextField
          fullWidth
          label="Confirmar nova senha"
          type="password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          error={confirmacao.length > 0 && novaSenha !== confirmacao}
          helperText={
            confirmacao.length > 0 && novaSenha !== confirmacao
              ? 'As senhas não coincidem'
              : undefined
          }
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSalvar}>
            {saving ? 'Salvando...' : 'Alterar Senha'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
