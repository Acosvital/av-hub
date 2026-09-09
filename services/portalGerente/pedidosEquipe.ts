import { apiFetch } from '@/lib/api/fetchHelper';
import { PedidoPlanilhaProps } from '@/app/(protected)/pedidos-equipe/types';
import { PaginatedResponse } from '../types';

interface GetPedidosEquipeParams {
  page?: number;
  limit?: number;
  numero_pedido?: string;
  data_inicio?: string;
  data_fim?: string;
  situacao?: string;
  etapa?: string;
  autorizado?: boolean;
  denegado?: boolean;
  faturado?: boolean;
  cancelado?: boolean;
  devolvido?: boolean;
  devolucao_parcial?: boolean;
  encerrado?: boolean;
  manual?: boolean;
}

export interface PedidosEquipeResponse extends PaginatedResponse {
  data: PedidoPlanilhaProps[];
}

export async function getPedidosEquipe(params: GetPedidosEquipeParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.numero_pedido) query.set('numero_pedido', params.numero_pedido);
  if (params.data_inicio) query.set('data_inicio', params.data_inicio);
  if (params.data_fim) query.set('data_fim', params.data_fim);
  if (params.situacao) query.set('situacao', params.situacao);
  if (params.etapa) query.set('etapa', params.etapa);
  (
    [
      'autorizado',
      'denegado',
      'faturado',
      'cancelado',
      'devolvido',
      'devolucao_parcial',
      'encerrado',
      'manual',
    ] as const
  ).forEach((flag) => {
    if (params[flag] !== undefined) query.set(flag, String(params[flag]));
  });
  return apiFetch<PedidosEquipeResponse>(
    `/api/pedidos-equipe?${query}`,
    'Erro ao buscar pedidos da equipe'
  );
}
