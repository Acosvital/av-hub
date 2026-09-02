import { DashboardHistoricoContext } from '@/contexts/DashboardHistoricoContext';
import { useContext } from 'react';

export function useDashboardHistorico() {
  const context = useContext(DashboardHistoricoContext);

  if (!context) {
    throw new Error('useDashboardHistorico deve ser usado dentro de DashboardHistoricoProvider');
  }

  return context;
}

export default useDashboardHistorico;
