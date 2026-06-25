'use client';
import Header from './Header/Header';
import Menu from './Menu/Menu';
import styles from './Layout.module.css';
import { Slide, ToastContainer } from 'react-toastify';
import useLayout from '@/hooks/useLayout';
import OverlayHeader from './OverlayHeader/OverlayHeader';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { mode, fullscreen, setMode } = useLayout();
  const pathname = usePathname();
  useEffect(() => {
    setMode(pathname.startsWith('/dashboard') ? 'dashboard' : 'default');
  }, [pathname, setMode]);

  return (
    <>
      <div className={styles.app}>
        {!fullscreen && <Menu />}
        <div className={styles.shell}>
          {mode === 'dashboard' ? <OverlayHeader /> : <Header />}
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
