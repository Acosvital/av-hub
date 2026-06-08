import { LayoutContext, LayoutMode } from '@/contexts/LayoutContext';
import { ReactNode, useState } from 'react';

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [mode, setMode] = useState<LayoutMode>('default');
  
  return (
    <LayoutContext.Provider
      value={{ mode, setMode, fullscreen, setFullscreen }}
    >
      {children}
    </LayoutContext.Provider>
  );
}