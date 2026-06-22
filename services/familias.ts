import { apiFetch } from '@/lib/api/fetchHelper';

export async function getFamilias() {
  return apiFetch('/api/familias', 'Erro ao buscar famílias de produtos');
}
