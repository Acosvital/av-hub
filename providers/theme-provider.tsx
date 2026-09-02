'use client';

import { useMemo, useState, useEffect, startTransition } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { getMuiTheme } from '@/theme/index';

function MuiProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useNextTheme();
  // Antes de montar no cliente, next-themes ainda não resolveu o tema (evita
  // divergência de hidratação) — assume 'light' até lá, igual ao <html> sem classe.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const muiTheme = useMemo(
    () => getMuiTheme(mounted && resolvedTheme === 'dark' ? 'dark' : 'light'),
    [mounted, resolvedTheme]
  );

  return (
    <AppRouterCacheProvider>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <MuiProvider>{children}</MuiProvider>
    </NextThemesProvider>
  );
}
