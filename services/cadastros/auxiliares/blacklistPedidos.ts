import { apiFetch } from '@/lib/api/fetchHelper';
import { BlacklistPedidoProps } from '@/app/(protected)/cadastros/auxiliares/blacklist_pedidos/types';
import { PaginatedResponse } from '../../types';

interface GetBlacklistPedidosParams {
  page?: number;
  limit?: number;
  numero_pedido?: string;
}

interface BlacklistPedidosResponse extends PaginatedResponse {
  blacklist_pedidos: BlacklistPedidoProps[];
}

// Nota: a API não filtra por codigo_empresa em /blacklist_pedidos (só
// numero_pedido) — mesmo o campo sendo obrigatório pra criar. Não expõe esse
// filtro aqui pra não sugerir uma capacidade que o backend não tem.
export async function getBlacklistPedidos(params: GetBlacklistPedidosParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.numero_pedido) query.set('numero_pedido', params.numero_pedido);
  return apiFetch<BlacklistPedidosResponse>(
    `/api/blacklist_pedidos?${query}`,
    'Erro ao buscar blacklist de pedidos'
  );
}

export async function criarBlacklistPedido(data: {
  numero_pedido: string;
  codigo_empresa: string;
  motivo?: string;
}) {
  return apiFetch('/api/blacklist_pedidos', 'Erro ao adicionar pedido à blacklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarBlacklistPedido(numeroPedido: string, data: { motivo?: string }) {
  return apiFetch(
    `/api/blacklist_pedidos/${encodeURIComponent(numeroPedido)}`,
    'Erro ao atualizar blacklist de pedidos',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
}

export async function deletarBlacklistPedido(numeroPedido: string) {
  return apiFetch(
    `/api/blacklist_pedidos/${encodeURIComponent(numeroPedido)}`,
    'Erro ao remover pedido da blacklist',
    { method: 'DELETE' }
  );
}
