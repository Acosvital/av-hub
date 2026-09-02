import { DashboardHistoricoContext } from '@/contexts/DashboardHistoricoContext';
import { ReactNode, useState } from 'react';

export function DashboardHistoricoProvider({ children }: { children: ReactNode }) {
  const [isHistorico, setIsHistorico] = useState(false);

  return (
    <DashboardHistoricoContext.Provider value={{ isHistorico, setIsHistorico }}>
      {children}
    </DashboardHistoricoContext.Provider>
  );
}
