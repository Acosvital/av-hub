import { createContext } from 'react';

export type LayoutMode =
  | 'default'
  | 'dashboard';

export type LayoutContextType = {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;

  fullscreen: boolean;
  setFullscreen: (value: boolean) => void;

  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
};

export const LayoutContext = createContext<
  LayoutContextType | undefined
>(undefined);