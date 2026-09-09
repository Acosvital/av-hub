import { apiFetch } from '@/lib/api/fetchHelper';
import { BlacklistVendedorProps } from '@/app/(protected)/cadastros/auxiliares/blacklist_vendedores/types';
import { PaginatedResponse } from '../../types';

interface GetBlacklistVendedoresParams {
  page?: number;
  limit?: number;
  nome_vendedor?: string;
}

interface BlacklistVendedoresResponse extends PaginatedResponse {
  blacklist_vendedores: BlacklistVendedorProps[];
}

export async function getBlacklistVendedores(params: GetBlacklistVendedoresParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome_vendedor) query.set('nome_vendedor', params.nome_vendedor);
  return apiFetch<BlacklistVendedoresResponse>(
    `/api/blacklist_vendedores?${query}`,
    'Erro ao buscar blacklist de vendedores'
  );
}

export async function criarBlacklistVendedor(data: { nome_vendedor: string; motivo?: string }) {
  return apiFetch('/api/blacklist_vendedores', 'Erro ao adicionar vendedor à blacklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarBlacklistVendedor(nomeVendedor: string, data: { motivo?: string }) {
  return apiFetch(
    `/api/blacklist_vendedores/${encodeURIComponent(nomeVendedor)}`,
    'Erro ao atualizar blacklist de vendedores',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
}

export async function deletarBlacklistVendedor(nomeVendedor: string) {
  return apiFetch(
    `/api/blacklist_vendedores/${encodeURIComponent(nomeVendedor)}`,
    'Erro ao remover vendedor da blacklist',
    { method: 'DELETE' }
  );
}
