'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import {
    CssBaseline,
    ThemeProvider as MuiThemeProvider,
} from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { getMuiTheme } from '@/theme/index';

function MuiProvider({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider>
            <MuiThemeProvider theme={getMuiTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </AppRouterCacheProvider>
    );
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
        >
            <MuiProvider>
                {children}
            </MuiProvider>
        </NextThemesProvider>
    );
}