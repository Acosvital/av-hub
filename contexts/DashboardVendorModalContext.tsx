import { createContext } from 'react';

export interface VendorModalRequest {
  dashboard: 'vendas' | 'faturamento';
  vendorId: number;
  filialId: string;
}

export type DashboardVendorModalContextType = {
  vendorModalRequest: VendorModalRequest | null;
  requestVendorModal: (request: VendorModalRequest) => void;
  clearVendorModalRequest: () => void;
};

export const DashboardVendorModalContext = createContext<
  DashboardVendorModalContextType | undefined
>(undefined);
