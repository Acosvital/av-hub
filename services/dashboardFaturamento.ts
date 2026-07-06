import { SellerRankingProps } from '@/app/(protected)/dashboards/dash-faturamento/types';
import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from './types';

interface GetSellerRankingParams {
  mes?: number;
  ano?: number;
  cod_vendedor?: string;
  vendedor?: string;
}

interface SellerRankingResponse extends PaginatedResponse {
  data: SellerRankingProps[];
}

export async function getRankingVendedores(params: GetSellerRankingParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.cod_vendedor) query.set('cod_vendedor', String(params.cod_vendedor));
  if (params.vendedor) query.set('vendedor', String(params.vendedor));
  return apiFetch<SellerRankingResponse>(
    `/api/dashboard/faturamento?${query}`,
    'Erro ao buscar ranking de vendedores'
  );
}
