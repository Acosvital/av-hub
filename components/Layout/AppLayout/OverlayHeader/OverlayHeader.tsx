import { useEffect, useRef, useState } from 'react';
import styles from './OverlayHeader.module.css';
import useLayout from '@/hooks/useLayout';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from '../Header/ThemeToggle/ThemeToggle';
import Avatar from '../Header/Avatar/Avatar';
import { ImExit } from 'react-icons/im';
import { MdFullscreen, MdFullscreenExit, MdOutlineHistory } from 'react-icons/md';
import { GiHamburgerMenu } from 'react-icons/gi';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { ptBR } from '@mui/x-date-pickers/locales';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { FaRegCalendarAlt } from 'react-icons/fa';

const OverlayHeader = () => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenDatePicker, setIsOpenDatePicker] = useState(false);
  const [isHistoric, setIsHistoric] = useState(false);
  const { fullscreen, setFullscreen, setMobileMenuOpen } = useLayout();
  const menuRef = useRef<HTMLDivElement>(null);
  const dateFilters = useRef<HTMLDivElement>(null);
  const userName = session?.user?.name ?? '';
  const userEmail = session?.user?.email ?? '';
  const [mouseVisible, setMouseVisible] = useState(true);
  const visible = !fullscreen || mouseVisible;

  useEffect(() => {
    document.documentElement.style.setProperty('--header-h', visible ? '60px' : '0px');
  }, [visible]);

  useEffect(() => {
    if (!fullscreen) {
      const id = setTimeout(() => setMouseVisible(true), 0);
      return () => clearTimeout(id);
    }

    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setMouseVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setMouseVisible(false), 3000);
    };

    timeout = setTimeout(() => setMouseVisible(false), 3000);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [fullscreen]);

  async function enterFullscreen() {
    await document.documentElement.requestFullscreen();
  }

  useEffect(() => {
    if (fullscreen) {
      enterFullscreen()
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [fullscreen])

  

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (dateFilters.current && !dateFilters.current.contains(event.target as Node)) {
        setIsOpenDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev);
    isOpenDatePicker && setIsOpenDatePicker(false);
  };

  const handleDatePicker = () => {
    setIsOpenDatePicker((prev) => !prev);
    isOpen && setIsOpen(false);
  };

  const handleHistoric = () => {
    setIsHistoric((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({
      callbackUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
    });
  };

  return (
    <header className={`${styles.header} ${visible ? styles.visible : styles.hidden}`}>
      <button
        className={`${styles.actionButton} ${styles.mobileMenuButton}`}
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Abrir menu"
      >
        <GiHamburgerMenu />
      </button>
      <span className={styles.title}>Aços Hub</span>

      {status === 'authenticated' && userName && (
        <div className={styles.buttonsContainer}>
          <button
            className={`${styles.actionButton} ${isHistoric && styles.active}`}
            onClick={handleHistoric}
            aria-label="Dados históricos"
          >
            <MdOutlineHistory />
          </button>
          <div className={`${styles.datePickerContainer}`} ref={dateFilters}>
            <button
              className={`${styles.actionButton}`}
              onClick={handleDatePicker}
              aria-label="Filtros de data"
            >
              <FaRegCalendarAlt />
            </button>
            {isOpenDatePicker && (
              <div className={styles.datePickerMenu}>
                <div className={styles.datePickerCard}>
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="pt-br"
                    localeText={ptBR.components.MuiLocalizationProvider.defaultProps.localeText}
                  >
                    <DateCalendar
                      openTo="month"
                      views={['year', 'month']}
                      minDate={dayjs('2026-04-01')}
                      maxDate={dayjs()}
                      yearsOrder="desc"
                      sx={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        maxHeight: '280px',
                        color: 'var(--foreground)',
                        '& .MuiPickersCalendarHeader-label': {
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                        },
                        '& .MuiPickersArrowSwitcher-button': {
                          color: 'var(--foreground)',
                          '&:hover': { backgroundColor: 'var(--surface-secondary)' },
                        },
                        '& .MuiPickersYear-yearButton': {
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                          '&.Mui-selected': {
                            backgroundColor: 'var(--primary-button-bg)',
                            color: 'var(--primary-button-fg)',
                          },
                          '&:hover': { backgroundColor: 'var(--surface-secondary)' },
                        },
                        '& .MuiPickersMonth-monthButton': {
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-sans)',
                          '&.Mui-selected': {
                            backgroundColor: 'var(--primary-button-bg)',
                            color: 'var(--primary-button-fg)',
                          },
                          '&:hover': { backgroundColor: 'var(--surface-secondary)' },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>
            )}
          </div>
          <button
            className={styles.actionButton}
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