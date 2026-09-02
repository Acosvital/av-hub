'use client';

import { SessionProvider } from 'next-auth/react';
import { AppThemeProvider } from './theme-provider';
import { LayoutProvider } from './LayoutProvider';
import { DashboardDateProvider } from './DashboardDateProvider';
import { DashboardEmpresaProvider } from './DashboardEmpresaProvider';
import { DashboardVendorModalProvider } from './DashboardVendorModalProvider';
import { DashboardHistoricoProvider } from './DashboardHistoricoProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppThemeProvider>
        <LayoutProvider>
          <DashboardDateProvider>
            <DashboardEmpresaProvider>
              <DashboardHistoricoProvider>
                <DashboardVendorModalProvider>{children}</DashboardVendorModalProvider>
              </DashboardHistoricoProvider>
            </DashboardEmpresaProvider>
          </DashboardDateProvider>
        </LayoutProvider>
      </AppThemeProvider>
    </SessionProvider>
  );
}
