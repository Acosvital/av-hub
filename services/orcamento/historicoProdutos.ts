import { ProdutoProps } from '@/app/(protected)/orcamento/historico-produtos/types';
import { PaginatedResponse } from '../types';
import produtosData from '@/app/(protected)/orcamento/_data/produtos.json';

interface GetProdutosParams {
  page?: number;
  limit?: number;
  fornecedor?: string;
  familia?: string;
  descricao?: string;
}

interface ProdutosResponse extends PaginatedResponse {
  catalogo_de_produtos: ProdutoProps[];
}

const produtos = produtosData as ProdutoProps[];

// Dados mockados (amostra extraída do app legado do setor de orçamento) — sem
// requisição real até existir uma API própria do módulo de compras.
export async function getProdutos(params: GetProdutosParams = {}): Promise<ProdutosResponse> {
  return {
    catalogo_de_produtos: produtos,
    total: produtos.length,
    page: params.page ?? 1,
    limit: params.limit ?? produtos.length,
    totalPages: 1,
  };
}
