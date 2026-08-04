import { useContext } from 'react';
import { LayoutContext } from '@/contexts/LayoutContext';

function useLayout() {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error('useLayout deve ser usado dentro de LayoutProvider');
  }

  return context;
}

export default useLayout;
