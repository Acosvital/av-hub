import { DashboardDateContext } from '@/contexts/DashboardDateContext';
import { useContext } from 'react';

export function useDashboardDate() {
  const context = useContext(DashboardDateContext);

  if (!context) {
    throw new Error('useDashboardDate deve ser usado dentro de DashboardDateProvider');
  }

  return context;
}

export default useDashboardDate;
