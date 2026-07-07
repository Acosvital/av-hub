'use client';

import { SessionProvider } from 'next-auth/react';
import { AppThemeProvider } from './theme-provider';
import { LayoutProvider } from './LayoutProvider';
import { DashboardDateProvider } from './DashboardDateProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppThemeProvider>
        <LayoutProvider>
          <DashboardDateProvider>{children}</DashboardDateProvider>
        </LayoutProvider>
      </AppThemeProvider>
    </SessionProvider>
  );
}
