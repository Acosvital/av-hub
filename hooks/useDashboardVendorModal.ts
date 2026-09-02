import { DashboardVendorModalContext } from '@/contexts/DashboardVendorModalContext';
import { useContext } from 'react';

export function useDashboardVendorModal() {
  const context = useContext(DashboardVendorModalContext);

  if (!context) {
    throw new Error(
      'useDashboardVendorModal deve ser usado dentro de DashboardVendorModalProvider'
    );
  }

  return context;
}

export default useDashboardVendorModal;
