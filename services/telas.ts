import { TelaProps } from '@/app/(protected)/cadastros/acessos/telas/types';
import { apiFetch } from '@/lib/api/fetchHelper';
import { PaginatedResponse } from './types';

interface GetTelasParams {
  page?: number;
  limit?: number;
  nome?: string;
  ativo?: boolean;
  id_parent?: string | null;
}

interface TelasResponse extends PaginatedResponse {
  menus: TelaProps[];
}

export async function getTelas(params: GetTelasParams = {}): Promise<TelasResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome) query.set('nome', params.nome);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  if (params.id_parent !== undefined && params.id_parent !== null)
    query.set('id_parent', params.id_parent);
  return apiFetch(`/api/telas?${query}`, 'Erro ao buscar telas');
}

export async function criarTela(data: object) {
  return apiFetch('/api/telas', 'Erro ao criar tela', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarTela(id: string, data: object) {
  return apiFetch(`/api/telas/${id}`, 'Erro ao atualizar tela', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarTela(id: string) {
  return apiFetch(`/api/telas/${id}`, 'Erro ao excluir tela', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}
