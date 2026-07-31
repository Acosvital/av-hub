import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from './types';
import {
  DetalheVendedorVendasPedidoProps,
  DetalheVendedorVendasResumoProps,
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
/************************* DETALHE VENDEDOR *************************/
interface GetDetalheVendedorVendasParams {
  cod_vendedor: string;
  codigo_empresa: string;
  mes: number;
  ano: number;
  numero_pedido?: string;
  numero_nf?: string;
  nome_cliente?: string;
  tipo_contrato?: string;
  classificacao?: string;
  situacao?: string;
  data_pedido?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: string;
  limit?: string;
}

interface DetalheVendedorVendasResponse {
  vendedor: DetalheVendedorVendasResumoProps;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  detalhes: DetalheVendedorVendasPedidoProps[];
}

export async function getDetalheVendedorVendas(params: GetDetalheVendedorVendasParams) {
  const query = new URLSearchParams();
  query.set('cod_vendedor', String(params.cod_vendedor));
  query.set('codigo_empresa', String(params.codigo_empresa));
  query.set('mes', String(params.mes));
  query.set('ano', String(params.ano));
  if (params.numero_pedido) query.set('numero_pedido', String(params.numero_pedido));
  if (params.numero_nf) query.set('numero_nf', String(params.numero_nf));
  if (params.nome_cliente) query.set('nome_cliente', String(params.nome_cliente));
  if (params.tipo_contrato) query.set('tipo_contrato', String(params.tipo_contrato));
  if (params.classificacao) query.set('classificacao', String(params.classificacao));
  if (params.situacao) query.set('situacao', String(params.situacao));
  if (params.data_pedido) query.set('data_pedido', String(params.data_pedido));
  if (params.data_inicio) query.set('data_inicio', String(params.data_inicio));
  if (params.data_fim) query.set('data_fim', String(params.data_fim));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<DetalheVendedorVendasResponse>(
    `/api/dashboard/vendas/detalhe-vendedor?${query}`,
    'Erro ao buscar detalhe do vendedor'
  );
}
