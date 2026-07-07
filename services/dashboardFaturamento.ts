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

/************************* RANKING VENDEDORES *************************/

interface GetSellerRankingParams {
  mes?: number;
  ano?: number;
  cod_vendedor?: string;
  vendedor?: string;
  page?: string;
  limit?: string;
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
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<SellerRankingResponse>(
    `/api/dashboard/faturamento/ranking-vendedores?${query}`,
    'Erro ao buscar ranking de vendedores'
  );
}
/************************* FATURAMENTO MENSAL *************************/
interface GetFaturamentoMensalParams {
  mes?: number;
  ano?: number;
  page?: string;
  limit?: string;
}

interface FaturamentoMensalResponse extends PaginatedResponse {
  data: FaturamentoMensalProps[];
}

export async function getFaturamentoMensal(params: GetFaturamentoMensalParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<FaturamentoMensalResponse>(
    `/api/dashboard/faturamento?${query}`,
    'Erro ao buscar faturamento mensal'
  );
}
/************************* FATURAMENTO POR TIPO *************************/
interface GetFaturamentoPorTipoParams {
  mes?: number;
  ano?: number;
  tipo_contrato?: string;
  page?: string;
  limit?: string;
}

interface FaturamentoPorTipoResponse extends PaginatedResponse {
  data: FaturamentoPorTipoProps[];
}

export async function getFaturamentoPorTipo(params: GetFaturamentoPorTipoParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.tipo_contrato) query.set('tipo_contrato', String(params.tipo_contrato));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<FaturamentoPorTipoResponse>(
    `/api/dashboard/faturamento/faturamento-por-tipo?${query}`,
    'Erro ao buscar faturamento por tipo'
  );
}
/************************* RITMO DE META *************************/
interface GetRitmoMetaFaturamentoParams {
  mes?: number;
  ano?: number;
  status_ritmo?: string;
  page?: string;
  limit?: string;
}

interface RitmoMetaFaturamentoResponse extends PaginatedResponse {
  data: RitmoMetaFaturamentoProps[];
}

export async function getRitmoMetaFaturamento(params: GetRitmoMetaFaturamentoParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.status_ritmo) query.set('status_ritmo', String(params.status_ritmo));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<RitmoMetaFaturamentoResponse>(
    `/api/dashboard/faturamento/ritmo-de-meta?${query}`,
    'Erro ao buscar ritmo de meta'
  );
}
/************************* SITUAÇÃO DOS PEDIDOS *************************/
interface GetSituacaoPedidosParams {
  mes?: number;
  ano?: number;
  grupo_deducao?: string;
  page?: string;
  limit?: string;
}

interface SituacaoPedidosResponse extends PaginatedResponse {
  data: SituacaoPedidosFaturadosProps[];
}

export async function getSituacaoPedidos(params: GetSituacaoPedidosParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.grupo_deducao) query.set('grupo_deducao', String(params.grupo_deducao));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<SituacaoPedidosResponse>(
    `/api/dashboard/faturamento/situacao-pedidos?${query}`,
    'Erro ao buscar situacao dos pedidos'
  );
}

/************************* RESUMO MENSAL *************************/
interface GetResumoMensalFaturamentoParams {
  periodo: string;
}

interface ResumoMensalFaturamentoResponse extends PaginatedResponse {
  data: ResumoMensalFaturamentoProps[];
}

export async function getResumoMensalFaturamento(params: GetResumoMensalFaturamentoParams) {
  const query = new URLSearchParams();
  query.set('periodo', params.periodo);
  return apiFetch<ResumoMensalFaturamentoResponse>(
    `/api/dashboard/faturamento/resumo-mensal?${query}`,
    'Erro ao buscar resumo mensal de faturamento'
  );
}
