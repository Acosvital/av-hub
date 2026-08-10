import {
  DetalheVendedorFaturamentoPedidoProps,
  DetalheVendedorFaturamentoResumoProps,
  FaturamentoMensalProps,
  FaturamentoPorTipoPorMesProps,
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
  data: FaturamentoPorTipoPorMesProps[];
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

export interface FaturamentoPorTipoBucket {
  mes: number;
  ano: number;
  entries: FaturamentoPorTipoProps[];
}

// Achata a resposta agrupada por mês ("MM/YYYY" -> entries) em uma lista de
// buckets ordenada cronologicamente (mais antigo primeiro).
export function parseFaturamentoPorTipoBuckets(
  data: FaturamentoPorTipoPorMesProps[] = []
): FaturamentoPorTipoBucket[] {
  return data
    .flatMap((bucket) => Object.values(bucket))
    .filter(
      (entries): entries is FaturamentoPorTipoProps[] => Array.isArray(entries) && entries.length > 0
    )
    .map((entries) => ({ mes: entries[0].mes, ano: entries[0].ano, entries }))
    .sort((a, b) => a.ano * 12 + a.mes - (b.ano * 12 + b.mes));
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
  periodo?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  page?: string;
  limit?: string;
}

interface ResumoMensalFaturamentoResponse extends PaginatedResponse {
  data: ResumoMensalFaturamentoProps[];
}

export async function getResumoMensalFaturamento(params: GetResumoMensalFaturamentoParams) {
  const query = new URLSearchParams();
  if (params.periodo) query.set('periodo', String(params.periodo));
  if (params.periodo_inicio) query.set('periodo_inicio', String(params.periodo_inicio));
  if (params.periodo_fim) query.set('periodo_fim', String(params.periodo_fim));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<ResumoMensalFaturamentoResponse>(
    `/api/dashboard/faturamento/resumo-mensal?${query}`,
    'Erro ao buscar resumo mensal de faturamento'
  );
}

/************************* DETALHE VENDEDOR *************************/
interface GetDetalheVendedorFaturamentoParams {
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

interface DetalheVendedorFaturamentoResponse {
  vendedor: DetalheVendedorFaturamentoResumoProps;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  detalhes: DetalheVendedorFaturamentoPedidoProps[];
}

export async function getDetalheVendedorFaturamento(params: GetDetalheVendedorFaturamentoParams) {
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
  return apiFetch<DetalheVendedorFaturamentoResponse>(
    `/api/dashboard/faturamento/detalhe-vendedor?${query}`,
    'Erro ao buscar detalhe do vendedor'
  );
}
