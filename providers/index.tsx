'use client';

import { SessionProvider } from 'next-auth/react';
import { AppThemeProvider } from './theme-provider';
import { LayoutProvider } from './LayoutProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppThemeProvider>
        <LayoutProvider>{children}</LayoutProvider>
      </AppThemeProvider>
    </SessionProvider>
  );
}
