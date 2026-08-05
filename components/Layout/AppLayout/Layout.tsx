'use client';
import Menu from './Menu/Menu';
import styles from './Layout.module.css';
import { Slide, ToastContainer } from 'react-toastify';
import useLayout from '@/hooks/useLayout';
import OverlayHeader from './OverlayHeader/OverlayHeader';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { mode, fullscreen, setMode, setFullscreen, mobileMenuOpen, setMobileMenuOpen } =
    useLayout();
  const pathname = usePathname();
  const wasDashboardRef = useRef(false);

  useEffect(() => {
    const isDashboard = pathname.startsWith('/dashboard');
    setMode(isDashboard ? 'dashboard' : 'default');

    if (isDashboard && !wasDashboardRef.current) {
      setFullscreen(true);
    } else if (!isDashboard) {
      setFullscreen(false);
    }
    wasDashboardRef.current = isDashboard;
  }, [pathname, setMode, setFullscreen]);

  // Fora dos dashboards não há mais um header — só o botão de abrir o
  // menu no mobile, que antes vinha do Header, continua acessível.
  const showMobileMenuButton = mode !== 'dashboard' && !mobileMenuOpen;

  return (
    <>
      <div className={styles.app}>
        {!fullscreen && <Menu />}
        <div className={styles.shell}>
          {mode === 'dashboard' && <OverlayHeader />}
          {showMobileMenuButton && (
            <button
              className={styles.mobileMenuButton}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <GiHamburgerMenu />
            </button>
          )}
          <main className={styles.mainArea}>{children}</main>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        transition={Slide}
      />
    </>
  );
};

export default Layout;
