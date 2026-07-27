import type { MenuItem } from '@/components/Layout/AppLayout/Menu/MenuItem/MenuItem';

export type Acao = 'pode_visualizar' | 'pode_criar' | 'pode_editar' | 'pode_deletar';

export function hasPermission(menu: MenuItem[], itemId: string, acao: Acao): boolean {
  for (const item of menu) {
    if (item.id === itemId) return item[acao] ?? false;
    if (item.submenu?.length) {
      const found = hasPermission(item.submenu, itemId, acao);
      if (found) return true;
    }
  }
  return false;
}
