import { DashboardEmpresaContext } from '@/contexts/DashboardEmpresaContext';
import { ReactNode, useState } from 'react';

export function DashboardEmpresaProvider({ children }: { children: ReactNode }) {
  const [codigoEmpresa, setCodigoEmpresa] = useState<string | null>(null);

  return (
    <DashboardEmpresaContext.Provider value={{ codigoEmpresa, setCodigoEmpresa }}>
      {children}
    </DashboardEmpresaContext.Provider>
  );
}
