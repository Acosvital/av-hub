import { ParceirosProps } from '@/app/(protected)/orcamento/fornecedores/types';
import fornecedoresData from '@/app/(protected)/orcamento/_data/fornecedores.json';

interface TodosFornecedoresResponse {
  fornecedores: ParceirosProps[];
  total: number;
}

const fornecedores = fornecedoresData as ParceirosProps[];

// Dados mockados — sem requisição real até existir uma API própria do módulo de compras.
export async function getTodosFornecedores(): Promise<TodosFornecedoresResponse> {
  return { fornecedores, total: fornecedores.length };
}
