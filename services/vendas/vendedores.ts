import { apiFetch } from '@/lib/api/fetchHelper';
import { VendedorCadastroProps } from '@/app/(protected)/vendas/vendedores/types';
import { PaginatedResponse } from '../types';

export type { VendedorCadastroProps as VendedorProps };

interface GetVendedoresCadastroParams {
  page?: number;
  limit?: number;
  codigo_vendedor_omie?: string;
  nome?: string;
  comissao?: boolean;
  ativo?: boolean;
}

interface VendedoresCadastroResponse extends PaginatedResponse {
  data: VendedorCadastroProps[];
}

export async function getVendedoresCadastro(params: GetVendedoresCadastroParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.codigo_vendedor_omie) query.set('codigo_vendedor_omie', params.codigo_vendedor_omie);
  if (params.nome) query.set('nome', params.nome);
  if (params.comissao !== undefined) query.set('comissao', String(params.comissao));
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  return apiFetch<VendedoresCadastroResponse>(
    `/api/vendedores?${query}`,
    'Erro ao buscar vendedores'
  );
}

export async function getVendedores() {
  return apiFetch<VendedoresCadastroResponse>(
    '/api/vendedores?limit=1000',
    'Erro ao buscar vendedores'
  );
}

export async function criarVendedor(data: object) {
  return apiFetch('/api/vendedores', 'Erro ao criar vendedor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarVendedor(id: string, data: object) {
  return apiFetch(`/api/vendedores/${id}`, 'Erro ao atualizar vendedor', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export interface SugestaoVinculo {
  id_funcionario: string;
  nome_funcionario: string;
  codigo_empresa_origem: string;
}

export async function getSugestaoVinculo(id: string) {
  return apiFetch<{ sugestao: SugestaoVinculo | null }>(
    `/api/vendedores/${id}/sugestoes`,
    'Erro ao buscar sugestão de vínculo'
  );
}

export async function deletarVendedor(id: string) {
  const res = await fetch(`/api/vendedores/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar vendedor — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar vendedor (status ${res.status})`);
  }
}
