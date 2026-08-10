import { apiFetch } from '@/lib/api/fetchHelper';
import { ProdutoCadastroProps } from '@/app/(protected)/cadastros/auxiliares/produtos/types';
import { PaginatedResponse } from '../../types';

interface GetProdutosCadastroParams {
  page?: number;
  limit?: number;
  codigo_produto?: string;
  descricao?: string;
  familias_produtos?: string;
  ativo?: boolean;
}

interface ProdutosCadastroResponse extends PaginatedResponse {
  produtos: ProdutoCadastroProps[];
}

export async function getProdutosCadastro(params: GetProdutosCadastroParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.codigo_produto) query.set('codigo_produto', params.codigo_produto);
  if (params.descricao) query.set('descricao', params.descricao);
  if (params.familias_produtos) query.set('familias_produtos', params.familias_produtos);
  if (params.ativo !== undefined) query.set('ativo', String(params.ativo));
  return apiFetch<ProdutosCadastroResponse>(`/api/produtos?${query}`, 'Erro ao buscar produtos');
}

export async function criarProduto(data: object) {
  return apiFetch('/api/produtos', 'Erro ao criar produto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function editarProduto(id: string, data: object) {
  return apiFetch(`/api/produtos/${id}`, 'Erro ao atualizar produto', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletarProduto(id: string) {
  const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.text().catch(() => '(sem corpo)');
    console.error(`Erro ao deletar produto — status ${res.status}: ${body}`);
    throw new Error(`Erro ao deletar produto (status ${res.status})`);
  }
}
