import { apiFetch } from '@/lib/api/fetchHelper';
import { CargoProps } from '@/app/(protected)/cadastros/auxiliares/cargos/types';
import { PaginatedResponse } from '../../types';

interface GetCargosParams {
  page?: number;
  limit?: number;
  nome?: string;
  codigo_empresa?: string;
  ativo?: boolean;
}

interface CargosResponse extends PaginatedResponse {
  cargos: CargoProps[];
}

export async function getCargos(params: GetCargosParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome) query.set('nome', params.nome);
  if (params.codigo_empresa) query.set('codigo_empresa', params.codigo_empresa);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  return apiFetch<CargosResponse>(`/api/cargos?${query}`, 'Erro ao buscar cargos');
}

export async function criarCargo(data: object) {
  return apiFetch('/api/cargos', 'Erro ao criar cargo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarCargo(id: string, data: object) {
  return apiFetch(`/api/cargos/${id}`, 'Erro ao atualizar cargo', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarCargo(id: string) {
  const res = await fetch(`/api/cargos/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar cargo — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar cargo (status ${res.status})`);
  }
}
