import { apiFetch } from '@/lib/api/fetchHelper';
import { FormPerfil, PerfilProps } from '@/app/(protected)/cadastros/acessos/perfis/types';
import { PaginatedResponse } from './types';

export interface GetPerfisParams {
  page?: number;
  limit?: number;
  nome?: string;
}

export interface PerfisResponse extends PaginatedResponse {
  perfis: PerfilProps[];
}

export async function getPerfis(params: GetPerfisParams = {}): Promise<PerfisResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome) query.set('nome', params.nome);
  return apiFetch(`/api/perfis?${query}`, 'Erro ao buscar perfis');
}

export async function criarPerfil(data: FormPerfil) {
  return apiFetch('/api/perfis', 'Erro ao criar perfil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarPerfil(id: string, data: FormPerfil) {
  return apiFetch(`/api/perfis/${id}`, 'Erro ao atualizar perfil', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarPerfil(id: string) {
  return apiFetch(`/api/perfis/${id}`, 'Erro ao deletar perfil', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
}
