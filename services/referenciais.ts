import { apiFetch } from '@/lib/api/fetchHelper';

export async function getCargos() {
  return apiFetch('/api/referenciais/cargos', 'Erro ao buscar cargos');
}

export async function getSetores() {
  return apiFetch('/api/referenciais/setores', 'Erro ao buscar setores');
}

export async function getUnidades() {
  return apiFetch('/api/referenciais/unidades', 'Erro ao buscar unidades');
}
