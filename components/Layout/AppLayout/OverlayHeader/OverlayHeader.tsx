import { useEffect, useRef, useState } from 'react';
import styles from './OverlayHeader.module.css';
import useLayout from '@/hooks/useLayout';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from '../Header/ThemeToggle/ThemeToggle';
import Avatar from '../Header/Avatar/Avatar';
import { ImExit } from 'react-icons/im';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const OverlayHeader = () => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const { fullscreen, setFullscreen } = useLayout();
  const menuRef = useRef<HTMLDivElement>(null);
  const userName = session?.user?.name ?? '';
  const userEmail = session?.user?.email ?? '';
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.documentElement.style.setProperty('--header-h', visible ? '60px' : '0px');
  }, [visible]);

  useEffect(() => {
    if (!fullscreen) {
      setVisible(true);
      return;
    }

    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(false), 3000);
    };

    timeout = setTimeout(() => setVisible(false), 3000);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [fullscreen]);

  useEffect(() => {
    if (fullscreen) {
      enterFullscreen()
    } else {
      document.exitFullscreen();
    }
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* <DatePicker
              label="Years in descending order"
              openTo="year"
              views={['year', 'month']}
              yearsOrder="desc"
              sx={{ minWidth: 250 }}
            /> */}
          </LocalizationProvider>
          <button
            className={styles.fullscreen}
            onClick={() => setFullscreen(!fullscreen)}
            aria-label="Alternar Tela cheia"
          >
            {fullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
          </button>
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