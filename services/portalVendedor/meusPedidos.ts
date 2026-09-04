import { apiFetch } from '@/lib/api/fetchHelper';
import { PedidoVendedorProps } from '@/app/(protected)/meus-pedidos/types';
import { PaginatedResponse } from '../types';

interface GetMeusPedidosParams {
  page?: number;
  limit?: number;
  numero_pedido?: string;
  data_inicio?: string;
  data_fim?: string;
  grupo?: string;
}

export interface MeusPedidosResponse extends PaginatedResponse {
  vinculado: boolean;
  data: PedidoVendedorProps[];
}

export async function getMeusPedidos(params: GetMeusPedidosParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.numero_pedido) query.set('numero_pedido', params.numero_pedido);
  if (params.data_inicio) query.set('data_inicio', params.data_inicio);
  if (params.data_fim) query.set('data_fim', params.data_fim);
  if (params.grupo) query.set('grupo', params.grupo);
  return apiFetch<MeusPedidosResponse>(`/api/meus-pedidos?${query}`, 'Erro ao buscar meus pedidos');
}
