import { apiFetch } from '@/lib/api/fetchHelper';
import { ParceiroProps } from '@/app/(protected)/cadastros/auxiliares/parceiros/types';
import { PaginatedResponse } from './types';

interface GetParceirosParams {
  page?: number;
  limit?: number;
  codigo_parceiro_omie?: string;
  nome_fantasia?: string;
  razao_social?: string;
  cpf_cnpj?: string;
  cidade?: string;
  estado?: string;
}

interface ParceirosResponse extends PaginatedResponse {
  parceiros: ParceiroProps[];
}

export async function getParceiros(params: GetParceirosParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.codigo_parceiro_omie) query.set('codigo_parceiro_omie', params.codigo_parceiro_omie);
  if (params.nome_fantasia) query.set('nome_fantasia', params.nome_fantasia);
  if (params.razao_social) query.set('razao_social', params.razao_social);
  if (params.cpf_cnpj) query.set('cpf_cnpj', params.cpf_cnpj);
  if (params.cidade) query.set('cidade', params.cidade);
  if (params.estado) query.set('estado', params.estado);
  return apiFetch<ParceirosResponse>(`/api/parceiros?${query}`, 'Erro ao buscar parceiros');
}

export async function criarParceiro(data: object) {
  return apiFetch('/api/parceiros', 'Erro ao criar parceiro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarParceiro(id: string, data: object) {
  return apiFetch(`/api/parceiros/${id}`, 'Erro ao atualizar parceiro', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarParceiro(id: string) {
  const res = await fetch(`/api/parceiros/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar parceiro — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar parceiro (status ${res.status})`);
  }
}
