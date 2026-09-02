import { createContext } from 'react';

export type DashboardHistoricoContextType = {
  isHistorico: boolean;
  setIsHistorico: (isHistorico: boolean) => void;
};

export const DashboardHistoricoContext = createContext<DashboardHistoricoContextType | undefined>(
  undefined
);
