import { apiFetch } from '@/lib/api/fetchHelper';
import { NotaFiscalVendedorProps } from '@/app/(protected)/minhas-notas/types';
import { PaginatedResponse } from '../types';

interface GetMinhasNotasParams {
  page?: number;
  limit?: number;
  numero_nf?: string;
  numero_pedido?: string;
  data_inicio?: string;
  data_fim?: string;
  grupo_deducao?: string;
}

export interface MinhasNotasResponse extends PaginatedResponse {
  vinculado: boolean;
  data: NotaFiscalVendedorProps[];
}

export async function getMinhasNotas(params: GetMinhasNotasParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.numero_nf) query.set('numero_nf', params.numero_nf);
  if (params.numero_pedido) query.set('numero_pedido', params.numero_pedido);
  if (params.data_inicio) query.set('data_inicio', params.data_inicio);
  if (params.data_fim) query.set('data_fim', params.data_fim);
  if (params.grupo_deducao) query.set('grupo_deducao', params.grupo_deducao);
  return apiFetch<MinhasNotasResponse>(
    `/api/minhas-notas?${query}`,
    'Erro ao buscar minhas notas fiscais'
  );
}
