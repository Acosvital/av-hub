import { apiFetch } from '@/lib/api/fetchHelper';
import type { MenuItem } from '@/components/Layout/AppLayout/Menu/MenuItem/MenuItem';

export async function getMenu(): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>('/api/menu', 'Erro ao buscar menu');
}
