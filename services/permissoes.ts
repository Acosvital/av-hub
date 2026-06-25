import { apiFetch } from '@/lib/api/fetchHelper';
import { PermissaoProps } from '@/app/(protected)/cadastros/acessos/permissoes/types';
import { PaginatedResponse } from './types';

interface GetPermissoesParams {
  page?: number;
  limit?: number;
  id_perfil?: string;
  id_tela?: string;
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
  return apiFetch<PermissoesResponse>(`/api/permissoes?${query}`, 'Erro ao buscar permissões');
}

export async function criarPermissao(data: object) {
  return apiFetch('/api/permissoes', 'Erro ao criar permissão', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarPermissao(id: string, data: object) {
  return apiFetch(`/api/permissoes/${id}`, 'Erro ao atualizar permissão', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarPermissao(id: string) {
  return apiFetch(`/api/permissoes/${id}`, 'Erro ao deletar permissão', {
    method: 'DELETE',
  });
}
