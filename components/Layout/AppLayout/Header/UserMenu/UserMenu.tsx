'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { ImExit } from 'react-icons/im';
import { MdLockReset } from 'react-icons/md';
import Avatar from '../Avatar/Avatar';
import AlterarSenhaModal from '../AlterarSenhaModal';
import styles from './UserMenu.module.css';

interface UserMenuProps {
  onOpen?: () => void;
}

export default function UserMenu({ onOpen }: UserMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isAlterarSenhaOpen, setIsAlterarSenhaOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name ?? session?.user?.email ?? '';
  const userEmail = session?.user?.email ?? '';
  const idUsuario = session?.user?.id_usuario ?? '';
  const isCredentials = session?.user?.authProvider === 'credentials';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (!prev) onOpen?.();
      return !prev;
    });
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({
      callbackUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
    });
  };

  return (
    <>
      <div className={styles.avatarContainer} ref={menuRef}>
        <Avatar name={userName} onClick={handleToggle} />
        {isOpen && (
          <div className={styles.configMenu}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userEmail}>{userEmail}</span>
            </div>
            <hr className={styles.divider} />
            {isCredentials && idUsuario && (
              <button
                className={styles.menuButton}
                onClick={() => { setIsOpen(false); setIsAlterarSenhaOpen(true); }}
              >
                <MdLockReset />
                Alterar Senha
              </button>
            )}
            <button className={styles.logoutButton} onClick={handleLogout}>
              <ImExit />
              Sair
            </button>
          </div>
        )}
      </div>
      {idUsuario && (
        <AlterarSenhaModal
          isOpen={isAlterarSenhaOpen}
          onClose={() => setIsAlterarSenhaOpen(false)}
          idUsuario={idUsuario}
        />
      )}
    </>
  );
}
