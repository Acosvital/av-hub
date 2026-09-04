import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from '../types';
import {
  ClientRankingVendasProps,
  DetalheVendedorVendasPedidoProps,
  DetalheVendedorVendasResumoProps,
  RankingVendedoresVendasProps,
  RitmoMetaVendasProps,
  VendaMensalProps,
  VendasPorTipoPorMesProps,
  VendasPorTipoProps,
} from '@/app/(protected)/dashboards/dash-vendas/types';

/************************* RANKING VENDEDORES *************************/

interface GetRankingVendedoresVendasParams {
  mes?: number;
  ano?: number;
  cod_vendedor?: string;
  vendedor?: string;
  codigo_empresa?: string;
  page?: string;
  limit?: string;
  is_track_record?: boolean;
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
  if (params.codigo_empresa) query.set('codigo_empresa', String(params.codigo_empresa));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  query.set('is_track_record', params.is_track_record ? 'TRUE' : 'FALSE');
  return apiFetch<RankingVendedoresVendasResponse>(
    `/api/dashboard/vendas/ranking-vendedores?${query}`,
    'Erro ao buscar ranking de vendedores'
  );
}
/************************* VENDA MENSAL *************************/
interface GetVendaMensalParams {
  mes?: number;
  ano?: number;
  codigo_empresa?: string;
  page?: string;
  limit?: string;
  is_track_record?: boolean;
}

interface VendaMensalResponse extends PaginatedResponse {
  data: VendaMensalProps[];
  // Só vem preenchido quando a consulta não filtra por codigo_empresa —
  // nesse caso `data` é a quebra por unidade (meta sempre null em cada
  // linha, já que a meta é global) e o total agregado (com a meta certa)
  // vem só aqui.
  consolidado?: VendaMensalProps;
}

export async function getVendaMensal(params: GetVendaMensalParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.codigo_empresa) query.set('codigo_empresa', String(params.codigo_empresa));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  query.set('is_track_record', params.is_track_record ? 'TRUE' : 'FALSE');
  return apiFetch<VendaMensalResponse>(
    `/api/dashboard/vendas?${query}`,
    'Erro ao buscar vendas mensais'
  );
}
/************************* VENDAS POR TIPO *************************/
interface GetVendasPorTipoParams {
  mes?: number;
  ano?: number;
  tipo_contrato?: string;
  codigo_empresa?: string;
  page?: string;
  limit?: string;
  is_track_record?: boolean;
}

interface VendasPorTipoResponse extends PaginatedResponse {
  data: VendasPorTipoPorMesProps[];
}

export async function getVendasPorTipo(params: GetVendasPorTipoParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.tipo_contrato) query.set('tipo_contrato', String(params.tipo_contrato));
  if (params.codigo_empresa) query.set('codigo_empresa', String(params.codigo_empresa));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  query.set('is_track_record', params.is_track_record ? 'TRUE' : 'FALSE');
  return apiFetch<VendasPorTipoResponse>(
    `/api/dashboard/vendas/vendas-por-tipo?${query}`,
    'Erro ao buscar vendas por tipo'
  );
}

export interface VendasPorTipoBucket {
  mes: number;
  ano: number;
  entries: VendasPorTipoProps[];
}

// Achata a resposta agrupada por mês ("MM/YYYY" -> entries) em uma lista de
// buckets ordenada cronologicamente (mais antigo primeiro).
export function parseVendasPorTipoBuckets(
  data: VendasPorTipoPorMesProps[] = []
): VendasPorTipoBucket[] {
  return data
    .flatMap((bucket) => Object.values(bucket))
    .filter(
      (entries): entries is VendasPorTipoProps[] => Array.isArray(entries) && entries.length > 0
    )
    .map((entries) => ({ mes: entries[0].mes, ano: entries[0].ano, entries }))
    .sort((a, b) => a.ano * 12 + a.mes - (b.ano * 12 + b.mes));
}
/************************* RANKING CLIENTES *************************/

interface GetRankingClientesVendasParams {
  mes?: number;
  ano?: number;
  codigo_cliente?: string;
  cpf_cnpj?: string;
  cliente?: string;
  codigo_empresa?: string;
  page?: string;
  limit?: string;
  is_track_record?: boolean;
}

interface RankingClientesVendasResponse extends PaginatedResponse {
  data: ClientRankingVendasProps[];
}

export async function getRankingClientesVendas(params: GetRankingClientesVendasParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.codigo_cliente) query.set('codigo_cliente', String(params.codigo_cliente));
  if (params.cpf_cnpj) query.set('cpf_cnpj', String(params.cpf_cnpj));
  if (params.cliente) query.set('cliente', String(params.cliente));
  if (params.codigo_empresa) query.set('codigo_empresa', String(params.codigo_empresa));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  query.set('is_track_record', params.is_track_record ? 'TRUE' : 'FALSE');
  return apiFetch<RankingClientesVendasResponse>(
    `/api/dashboard/vendas/ranking-clientes?${query}`,
    'Erro ao buscar ranking de clientes'
  );
}
/************************* RITMO DE META *************************/
interface GetRitmoMetaVendasParams {
  mes?: number;
  ano?: number;
  status_ritmo?: string;
  codigo_empresa?: string;
  page?: string;
  limit?: string;
  is_track_record?: boolean;
}

interface RitmoMetaVendasResponse extends PaginatedResponse {
  data: RitmoMetaVendasProps[];
}

export async function getRitmoMetaVendas(params: GetRitmoMetaVendasParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.status_ritmo) query.set('status_ritmo', String(params.status_ritmo));
  if (params.codigo_empresa) query.set('codigo_empresa', String(params.codigo_empresa));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  query.set('is_track_record', params.is_track_record ? 'TRUE' : 'FALSE');
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
  is_track_record?: boolean;
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
  query.set('is_track_record', params.is_track_record ? 'TRUE' : 'FALSE');
  return apiFetch<DetalheVendedorVendasResponse>(
    `/api/dashboard/vendas/detalhe-vendedor?${query}`,
    'Erro ao buscar detalhe do vendedor'
  );
}
