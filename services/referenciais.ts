import { SetoresProps } from '@/app/(protected)/rh/solicitacoes-de-vagas/types';
import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from './types';

export interface UnidadeProps {
  id: string;
  nome: string;
}

interface UnidadesResponse {
  unidades: UnidadeProps[];
}

/******* SETORES *******/
interface GetSetoresParams {
  page?: number;
  limit?: number;
  ativo?: boolean;
}
interface SetoresResponse extends PaginatedResponse {
  setores: SetoresProps[];
}

export async function getCargos() {
  return apiFetch('/api/referenciais/cargos', 'Erro ao buscar cargos');
}

export async function getSetores(params: GetSetoresParams = {}): Promise<SetoresResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  return apiFetch(`/api/referenciais/setores?${query}`, 'Erro ao buscar setores');
}

export async function getUnidades() {
  return apiFetch<UnidadesResponse>('/api/referenciais/unidades', 'Erro ao buscar unidades');
}
