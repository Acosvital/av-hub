import type { SxProps, Theme } from '@mui/material/styles';

// Estilo compartilhado do DateCalendar (MesSeletor + OverlayHeader) — vidro
// fosco + acabamento "LED" na cor da marca (--av-accent), igual ao resto do
// app (mesma receita de glass de pageGlow/tableCard: cor-mix + backdrop-filter).
//
// As classes de mês/ano abaixo (MuiMonthCalendar-button / MuiYearCalendar-button)
// são as reais desta versão do @mui/x-date-pickers (v9) — o código anterior
// usava .MuiPickersMonth-monthButton/.MuiPickersYear-yearButton, que não
// existem mais nesta versão (renomeadas), então a cor de seleção nunca
// aplicava de fato.
export const dateCalendarSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: 340,
  // O DateCalendar reserva uma altura fixa (336px, pensada pra grade de dias
  // — 6 linhas) mesmo só usando views ['year','month'] (4 linhas) — sobrava
  // um vão vazio embaixo de out/nov/dez. Altura livre = acompanha o conteúdo.
  height: 'auto',
  backgroundColor: 'transparent',
  color: 'var(--foreground)',

  '& .MuiPickersCalendarHeader-root': {
    position: 'relative',
    paddingBottom: '16px',
    marginBottom: '6px',
  },
  // Tira de LED sob o cabeçalho (ano/mês + setas), no lugar de uma borda lisa.
  '& .MuiPickersCalendarHeader-root::after': {
    content: '""',
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 0,
    height: '2px',
    borderRadius: 999,
    background:
      'linear-gradient(90deg, transparent, color-mix(in srgb, var(--av-accent) 70%, transparent) 20%, var(--av-accent) 50%, color-mix(in srgb, var(--av-accent) 70%, transparent) 80%, transparent)',
    boxShadow: '0 0 10px 1px color-mix(in srgb, var(--av-accent) 55%, transparent)',
  },
  '& .MuiPickersCalendarHeader-label': {
    color: 'var(--foreground)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--w-black)',
    fontSize: 'var(--fs-xl)',
    letterSpacing: '-0.02em',
  },
  // Setas de navegação viram chips de vidro (em vez de ícone pelado) — mesmo
  // acabamento "ghost button" do resto do app, com um leve lift + brilho na
  // cor da marca no hover, igual ao toque dado no modal de detalhe do vendedor.
  '& .MuiPickersArrowSwitcher-button': {
    color: 'var(--foreground-secondary)',
    border: '1px solid color-mix(in srgb, var(--foreground) 12%, transparent)',
    backgroundColor: 'color-mix(in srgb, var(--foreground) 4%, transparent)',
    transition:
      'background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease, box-shadow 140ms ease',
    '&:hover': {
      backgroundColor: 'color-mix(in srgb, var(--av-accent) 16%, transparent)',
      borderColor: 'color-mix(in srgb, var(--av-accent) 45%, transparent)',
      color: 'var(--av-accent)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 10px -4px color-mix(in srgb, var(--av-accent) 60%, transparent)',
    },
    '&.Mui-disabled': { opacity: 0.3, transform: 'none', boxShadow: 'none' },
  },

  '& .MuiYearCalendar-button, & .MuiMonthCalendar-button': {
    position: 'relative',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--w-bold)',
    borderRadius: 'var(--radius-lg)',
    transition: 'background 140ms ease, box-shadow 200ms ease, color 140ms ease, transform 140ms ease',
    '&:hover': {
      backgroundColor: 'color-mix(in srgb, var(--foreground) 9%, transparent)',
      transform: 'translateY(-1px)',
    },
    '&.Mui-disabled': { opacity: 0.34, transform: 'none' },
    // "Mês/ano atual" — MUI marca com aria-current="date", sem classe própria
    // pra estilizar — um LED verde discreto no canto, igual ao resto do app
    // (mesma cor de --green usada em badges de "faturado").
    '&[aria-current="date"]::after': {
      content: '""',
      position: 'absolute',
      top: 6,
      right: 8,
      width: 6,
      height: 6,
      borderRadius: '50%',
      backgroundColor: 'var(--green)',
      boxShadow: '0 0 6px 1px color-mix(in srgb, var(--green) 70%, transparent)',
    },
    // Selecionado: gradiente na cor da marca "vazando" luz por trás do vidro,
    // com um filete de brilho no topo (inset) pra reforçar a leitura "vidro".
    '&.Mui-selected': {
      background:
        'linear-gradient(155deg, color-mix(in srgb, var(--av-accent) 92%, white 8%), var(--av-accent) 55%, color-mix(in srgb, var(--av-accent) 82%, black 18%))',
      color: '#fff5ee',
      transform: 'translateY(-1px)',
      boxShadow:
        '0 0 0 1px color-mix(in srgb, var(--av-accent) 40%, transparent), 0 6px 14px -4px color-mix(in srgb, var(--av-accent) 65%, transparent), 0 0 22px 2px color-mix(in srgb, var(--av-accent) 45%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
    },
    '&.Mui-selected:hover': {
      background:
        'linear-gradient(155deg, color-mix(in srgb, var(--av-accent) 92%, white 8%), var(--av-accent) 55%, color-mix(in srgb, var(--av-accent) 82%, black 18%))',
    },
    '&.Mui-selected[aria-current="date"]::after': {
      backgroundColor: '#eafff2',
      boxShadow: '0 0 6px 1.5px rgba(255, 255, 255, 0.85)',
    },
  },
};

// O cabeçalho mostra "mês ano" por padrão (ex.: "setembro 2026") — redundante
// aqui porque o próprio grid abaixo já mostra o nome do mês em cada botão.
// Só o ano no cabeçalho, o resto (setas/troca pra ano) continua igual.
export const dateCalendarSlotProps = {
  calendarHeader: { format: 'YYYY' },
};
