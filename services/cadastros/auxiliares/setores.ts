import { apiFetch } from '@/lib/api/fetchHelper';
import { SetorProps } from '@/app/(protected)/cadastros/auxiliares/setores/types';
import { PaginatedResponse } from '../../types';

interface GetSetoresParams {
  page?: number;
  limit?: number;
  nome?: string;
  codigo_empresa?: string;
  ativo?: boolean;
}

interface SetoresResponse extends PaginatedResponse {
  setores: SetorProps[];
}

export async function getSetores(params: GetSetoresParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome) query.set('nome', params.nome);
  if (params.codigo_empresa) query.set('codigo_empresa', params.codigo_empresa);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  return apiFetch<SetoresResponse>(`/api/setores?${query}`, 'Erro ao buscar setores');
}

export async function criarSetor(data: object) {
  return apiFetch('/api/setores', 'Erro ao criar setor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarSetor(id: string, data: object) {
  return apiFetch(`/api/setores/${id}`, 'Erro ao atualizar setor', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarSetor(id: string) {
  const res = await fetch(`/api/setores/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar setor — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar setor (status ${res.status})`);
  }
}
