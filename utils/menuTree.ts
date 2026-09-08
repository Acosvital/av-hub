import type { MenuItem } from '@/components/Layout/AppLayout/Menu/MenuItem/MenuItem';

// Acha a rota completa de um item pelo id, andando a árvore do menu do
// próprio usuário (mesma regra de composição de path usada em Menu.tsx:
// pai/filho vira `${pai}/${filho}`). Não existe (nem precisa existir) um
// mapa separado id->rota: a árvore do menu já É esse mapa.
export function encontrarPathDoItem(items: MenuItem[], itemId: string, prefix = ''): string | null {
  for (const item of items) {
    const path = prefix ? `${prefix}/${item.id}` : item.id;
    if (item.id === itemId) return path;
    if (item.submenu?.length) {
      const found = encontrarPathDoItem(item.submenu, itemId, path);
      if (found) return found;
    }
  }
  return null;
}
