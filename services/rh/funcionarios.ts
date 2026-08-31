import { apiFetch } from '@/lib/api/fetchHelper';
import { FuncionarioProps } from '@/app/(protected)/rh/funcionarios/types';
import { PaginatedResponse } from '../types';

interface GetFuncionariosParams {
  page?: number;
  limit?: number;
  nome_completo?: string;
  email?: string;
  codigo_empresa?: string;
  id_setor?: string;
  id_cargo?: string;
}

interface FuncionariosResponse extends PaginatedResponse {
  funcionarios: FuncionarioProps[];
}

export async function getFuncionarios(params: GetFuncionariosParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.nome_completo) query.set('nome_completo', params.nome_completo);
  if (params.email) query.set('email', params.email);
  if (params.codigo_empresa) query.set('codigo_empresa', params.codigo_empresa);
  if (params.id_setor) query.set('id_setor', params.id_setor);
  if (params.id_cargo) query.set('id_cargo', params.id_cargo);
  return apiFetch<FuncionariosResponse>(`/api/funcionarios?${query}`, 'Erro ao buscar funcionários');
}

export async function criarFuncionario(data: object) {
  return apiFetch('/api/funcionarios', 'Erro ao criar funcionário', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarFuncionario(id: string, data: object) {
  return apiFetch(`/api/funcionarios/${id}`, 'Erro ao atualizar funcionário', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarFuncionario(id: string) {
  const res = await fetch(`/api/funcionarios/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar funcionário — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar funcionário (status ${res.status})`);
  }
}
