'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import styles from './Header.module.css';
import Avatar from './Avatar/Avatar';
import { ImExit } from 'react-icons/im';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import { GiHamburgerMenu } from 'react-icons/gi';
import useLayout from '@/hooks/useLayout';

export default function Header() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userName = session?.user?.name ?? '';
  const userEmail = session?.user?.email ?? '';
  const { setMobileMenuOpen } = useLayout();

  // Fecha o menu caso clique fora do componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({
      callbackUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
    });
  };
  console.log(session)
  return (
    <header className={styles.header}>
      <button className={styles.mobileMenuButton} onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu">
        <GiHamburgerMenu />
      </button>
      <span className={styles.title}>Aços Hub</span>
      {/* <div className={styles.search}>
        <CiSearch />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar..."
        />
      </div> */}
      {status === 'authenticated' && userName && (
        <div className={styles.buttonsContainer}>
          <ThemeToggle />
          <div className={styles.avatarContainer} ref={menuRef}>
            <Avatar name={userName} onClick={handleToggleMenu} />
            {isOpen && (
              <div className={styles.configMenu}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{userName}</span>
                  <span className={styles.userEmail}>{userEmail}</span>
                </div>
                <hr className={styles.divider} />
                <button className={styles.logoutButton} onClick={handleLogout}>
                  <ImExit />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
