import { createContext } from 'react';

export type DashboardEmpresaContextType = {
  // null = todas as empresas; string = filtrado por um codigo_empresa específico.
  codigoEmpresa: string | null;
  setCodigoEmpresa: (codigoEmpresa: string | null) => void;
};

export const DashboardEmpresaContext = createContext<DashboardEmpresaContextType | undefined>(
  undefined
);
