import { apiFetch } from '@/lib/api/fetchHelper';
import { MeuDashboardResponse } from '@/app/(protected)/meu-dashboard/types';

interface GetMeuDashboardParams {
  mes?: number;
  ano?: number;
}

export async function getMeuDashboard(params: GetMeuDashboardParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  return apiFetch<MeuDashboardResponse>(
    `/api/meu-dashboard?${query}`,
    'Erro ao buscar meu dashboard'
  );
}
