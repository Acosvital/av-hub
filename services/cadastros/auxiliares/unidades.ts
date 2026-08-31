import { apiFetch } from '@/lib/api/fetchHelper';
import { UnidadeProps } from '@/app/(protected)/cadastros/auxiliares/unidades/types';
import { PaginatedResponse } from '../../types';

interface GetUnidadesParams {
  page?: number;
  limit?: number;
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  tipo_unidade?: string;
  cidade?: string;
  estado?: string;
}

interface UnidadesResponse extends PaginatedResponse {
  unidades: UnidadeProps[];
}

export async function getUnidades(params: GetUnidadesParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.razao_social) query.set('razao_social', params.razao_social);
  if (params.nome_fantasia) query.set('nome_fantasia', params.nome_fantasia);
  if (params.cnpj) query.set('cnpj', params.cnpj);
  if (params.tipo_unidade) query.set('tipo_unidade', params.tipo_unidade);
  if (params.cidade) query.set('cidade', params.cidade);
  if (params.estado) query.set('estado', params.estado);
  return apiFetch<UnidadesResponse>(`/api/unidades?${query}`, 'Erro ao buscar unidades');
}

export async function criarUnidade(data: object) {
  return apiFetch('/api/unidades', 'Erro ao criar unidade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarUnidade(id: string, data: object) {
  return apiFetch(`/api/unidades/${id}`, 'Erro ao atualizar unidade', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarUnidade(id: string) {
  const res = await fetch(`/api/unidades/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar unidade — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar unidade (status ${res.status})`);
  }
}
