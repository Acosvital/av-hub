import {
  FaturamentoMensalProps,
  FaturamentoPorTipoProps,
  ResumoMensalFaturamentoProps,
  RitmoMetaFaturamentoProps,
  SellerRankingProps,
  SituacaoPedidosFaturadosProps,
} from '@/app/(protected)/dashboards/dash-faturamento/types';
import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from './types';
import {
  RankingVendedoresVendasProps,
  RitmoMetaVendasProps,
  VendaMensalProps,
} from '@/app/(protected)/dashboards/dash-vendas/types';

/************************* RANKING VENDEDORES *************************/

interface GetRankingVendedoresVendasParams {
  mes?: number;
  ano?: number;
  cod_vendedor?: string;
  vendedor?: string;
  page?: string;
  limit?: string;
}

interface RankingVendedoresVendasResponse extends PaginatedResponse {
  data: RankingVendedoresVendasProps[];
}

export async function getRankingVendedoresVendas(params: GetRankingVendedoresVendasParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.cod_vendedor) query.set('cod_vendedor', String(params.cod_vendedor));
  if (params.vendedor) query.set('vendedor', String(params.vendedor));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<RankingVendedoresVendasResponse>(
    `/api/dashboard/vendas/ranking-vendedores?${query}`,
    'Erro ao buscar ranking de vendedores'
  );
}
/************************* VENDA MENSAL *************************/
interface GetVendaMensalParams {
  mes?: number;
  ano?: number;
  page?: string;
  limit?: string;
}

interface VendaMensalResponse extends PaginatedResponse {
  data: VendaMensalProps[];
}

export async function getVendaMensal(params: GetVendaMensalParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<VendaMensalResponse>(
    `/api/dashboard/vendas?${query}`,
    'Erro ao buscar vendas mensais'
  );
}
/************************* RITMO DE META *************************/
interface GetRitmoMetaVendasParams {
  mes?: number;
  ano?: number;
  status_ritmo?: string;
  page?: string;
  limit?: string;
}

interface RitmoMetaVendasResponse extends PaginatedResponse {
  data: RitmoMetaVendasProps[];
}

export async function getRitmoMetaVendas(params: GetRitmoMetaVendasParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.status_ritmo) query.set('status_ritmo', String(params.status_ritmo));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<RitmoMetaVendasResponse>(
    `/api/dashboard/vendas/ritmo-de-meta?${query}`,
    'Erro ao buscar ritmo de meta'
  );
}
