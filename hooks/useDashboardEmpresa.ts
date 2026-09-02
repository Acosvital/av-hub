import { DashboardEmpresaContext } from '@/contexts/DashboardEmpresaContext';
import { useContext } from 'react';

export function useDashboardEmpresa() {
  const context = useContext(DashboardEmpresaContext);

  if (!context) {
    throw new Error('useDashboardEmpresa deve ser usado dentro de DashboardEmpresaProvider');
  }

  return context;
}

export default useDashboardEmpresa;
