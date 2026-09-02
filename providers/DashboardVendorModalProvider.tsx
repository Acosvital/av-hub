import {
  DashboardVendorModalContext,
  VendorModalRequest,
} from '@/contexts/DashboardVendorModalContext';
import { ReactNode, useState } from 'react';

export function DashboardVendorModalProvider({ children }: { children: ReactNode }) {
  const [vendorModalRequest, setVendorModalRequest] = useState<VendorModalRequest | null>(null);

  return (
    <DashboardVendorModalContext.Provider
      value={{
        vendorModalRequest,
        requestVendorModal: setVendorModalRequest,
        clearVendorModalRequest: () => setVendorModalRequest(null),
      }}
    >
      {children}
    </DashboardVendorModalContext.Provider>
  );
}
