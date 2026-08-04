import { apiFetch } from '@/lib/api/fetchHelper';
import { PermissaoProps } from '@/app/(protected)/cadastros/acessos/permissoes/types';
import { PaginatedResponse } from './types';

interface GetPermissoesParams {
  page?: number;
  limit?: number;
  id_perfil?: string;
  id_tela?: string;
  pode_visualizar?: string;
  pode_criar?: string;
  pode_editar?: string;
  pode_deletar?: string;
}

interface PermissoesResponse extends PaginatedResponse {
  permissoes: PermissaoProps[];
}

export async function getPermissoes(params: GetPermissoesParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.id_perfil) query.set('id_perfil', params.id_perfil);
  if (params.id_tela) query.set('id_tela', params.id_tela);
  if (params.pode_visualizar) query.set('pode_visualizar', params.pode_visualizar);
  if (params.pode_criar) query.set('pode_criar', params.pode_criar);
  if (params.pode_editar) query.set('pode_editar', params.pode_editar);
  if (params.pode_deletar) query.set('pode_deletar', params.pode_deletar);
  return apiFetch<PermissoesResponse>(`/api/permissoes?${query}`, 'Erro ao buscar permissões');
}

export interface BulkPermissaoPayload {
  id_perfil: string;
  permissoes: Array<{
    id_tela: string;
    pode_visualizar: boolean;
    pode_criar: boolean;
    pode_editar: boolean;
    pode_deletar: boolean;
  }>;
}

export async function criarPermissoesBulk(data: BulkPermissaoPayload) {
  return apiFetch('/api/permissoes/bulk', 'Erro ao criar permissões em lote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
