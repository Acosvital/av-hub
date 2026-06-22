import { apiFetch } from '@/lib/api/fetchHelper';

interface GetProdutosParams {
  page?: number;
  limit?: number;
  fornecedor?: string;
  familia?: string;
  descricao?: string;
}

export async function getProdutos(params: GetProdutosParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.fornecedor) query.set('fornecedor', String(params.fornecedor));
  if (params.familia) query.set('familia', String(params.familia));
  if (params.descricao) query.set('descricao', String(params.descricao));
  return apiFetch(`/api/produtos?${query}`, 'Erro ao buscar produtos');
}
