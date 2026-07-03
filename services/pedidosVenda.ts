import { apiFetch } from '@/lib/api/fetchHelper';
import { PedidoVendaProps } from '@/app/(protected)/vendass/pedidos-de-venda/types';
import { PaginatedResponse } from './types';

interface GetPedidosVendaParams {
  page?: number;
  limit?: number;
  numero_pedido?: string;
  codigo_cliente?: string;
  codigo_vendedor?: string;
  codigo_empresa?: string;
  situacao?: string;
}

interface PedidosVendaResponse extends PaginatedResponse {
  pedidos_vendas: PedidoVendaProps[];
}

export async function getPedidosVenda(params: GetPedidosVendaParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.numero_pedido) query.set('numero_pedido', params.numero_pedido);
  if (params.codigo_cliente) query.set('codigo_cliente', params.codigo_cliente);
  if (params.codigo_vendedor) query.set('codigo_vendedor', params.codigo_vendedor);
  if (params.codigo_empresa) query.set('codigo_empresa', params.codigo_empresa);
  if (params.situacao) query.set('situacao', params.situacao);
  return apiFetch<PedidosVendaResponse>(
    `/api/pedidos-venda?${query}`,
    'Erro ao buscar pedidos de venda'
  );
}
