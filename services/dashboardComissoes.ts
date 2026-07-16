import { ComissoesProvisoriasProps } from '@/app/(protected)/dashboards/dash-comissoes/types';
import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from './types';

/************************* JSON COMPLETO *************************/

interface GetComissoesProvisoriasParams {
  ano_mes?: string;
  page?: string;
  limit?: string;
}

interface ComissoesProvisoriasResponse extends PaginatedResponse {
  comissoes_provisoria: ComissoesProvisoriasProps[];
}

export async function getComissoesProvisorias(params: GetComissoesProvisoriasParams = {}) {
  const query = new URLSearchParams();
  if (params.ano_mes) query.set('ano_mes', String(params.ano_mes));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<ComissoesProvisoriasResponse>(
    `/api/dashboard/comissoes/comissoes-provisorias?${query}`,
    'Erro ao buscar comissões'
  );
}
