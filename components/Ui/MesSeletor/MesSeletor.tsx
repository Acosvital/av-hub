'use client';

import { useEffect, useRef, useState } from 'react';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { ptBR } from '@mui/x-date-pickers/locales';
import useDashboardDate from '@/hooks/useDashboardDate';
import styles from './MesSeletor.module.css';

// Seletor de mês/ano só pra este grupo de telas (Portal do Vendedor) — o
// header global (OverlayHeader) só monta em rotas /dashboard/*, então essas
// 3 telas (fora desse prefixo) nunca tinham como trocar de mês. Reaproveita
// o mesmo useDashboardDate() (contexto global), só que sem os controles de
// admin do OverlayHeader (busca, seletor de empresa, histórico) que não
// fazem sentido no autoatendimento do vendedor.
export default function MesSeletor() {
  const { completeDate, setCompleteDate } = useDashboardDate();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setAberto((prev) => !prev)}
        aria-label="Escolher mês"
      >
        <FaRegCalendarAlt />
        {completeDate.locale('pt-br').format('MMMM [de] YYYY')}
      </button>
      {aberto && (
        <div className={styles.menu}>
          <div className={styles.card}>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="pt-br"
              localeText={ptBR.components.MuiLocalizationProvider.defaultProps.localeText}
            >
              <DateCalendar
                openTo="month"
                views={['year', 'month']}
                minDate={dayjs('2026-01-01')}
                maxDate={dayjs()}
                value={completeDate}
                onChange={(value) => {
                  if (!value) return;
                  setCompleteDate(value);
                  setAberto(false);
                }}
                yearsOrder="desc"
                sx={{
                  backgroundColor: 'var(--card-bg)',
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
  );
}
