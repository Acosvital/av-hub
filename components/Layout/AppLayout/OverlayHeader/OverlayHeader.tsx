import { useEffect, useRef, useState } from 'react';
import styles from './OverlayHeader.module.css';
import useLayout from '@/hooks/useLayout';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from '../Header/ThemeToggle/ThemeToggle';
import Avatar from '../Header/Avatar/Avatar';
import { ImExit } from 'react-icons/im';

const OverlayHeader = () => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const { mode, fullscreen, setFullscreen } = useLayout();
  const menuRef = useRef<HTMLDivElement>(null);
  const userName = session?.user?.name ?? '';
  const userEmail = session?.user?.email ?? '';
  const [visible, setVisible] = useState(fullscreen);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setVisible(false);
      }, 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (fullscreen) enterFullscreen()
    else document.exitFullscreen();
  }, [fullscreen])

  async function enterFullscreen() {
    await document.documentElement.requestFullscreen();
  }

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({
      callbackUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
    });
  };
  return (
    <header className={`${styles.header} ${visible ? styles.visible : styles.hidden}`}>
      <span className={styles.title}>Aços Hub</span>

      {status === 'authenticated' && userName && (
        <div className={styles.buttonsContainer}>
          {mode === 'dashboard' && (<button onClick={() => setFullscreen(!fullscreen)}>teste</button>)}
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
  )
}

export default OverlayHeader;