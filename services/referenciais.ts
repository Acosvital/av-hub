import { apiFetch } from '@/lib/api/fetchHelper';

export interface UnidadeProps {
  id: string;
  nome: string;
}

interface UnidadesResponse {
  unidades: UnidadeProps[];
}

export async function getCargos() {
  return apiFetch('/api/referenciais/cargos', 'Erro ao buscar cargos');
}

export async function getSetores() {
  return apiFetch('/api/referenciais/setores', 'Erro ao buscar setores');
}

export async function getUnidades() {
  return apiFetch<UnidadesResponse>('/api/referenciais/unidades', 'Erro ao buscar unidades');
}
