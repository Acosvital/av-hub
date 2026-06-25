'use client';

import { useSession } from 'next-auth/react';
import styles from './Header.module.css';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import { GiHamburgerMenu } from 'react-icons/gi';
import useLayout from '@/hooks/useLayout';
import UserMenu from './UserMenu/UserMenu';

export default function Header() {
  const { status } = useSession();
  const { setMobileMenuOpen } = useLayout();
  return (
    <header className={styles.header}>
      <button className={styles.mobileMenuButton} onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu">
        <GiHamburgerMenu />
      </button>
      <span className={styles.title}>Aços Hub</span>
      {status === 'authenticated' && (
        <div className={styles.buttonsContainer}>
          <ThemeToggle />
          <UserMenu />
        </div>
      )}
    </header>
  );
}
