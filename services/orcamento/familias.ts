import { FamiliaProdutosProps } from '@/app/(protected)/orcamento/historico-produtos/types';
import familiasData from '@/app/(protected)/orcamento/_data/familias.json';

interface FamiliasResponse {
  familias_produtos: FamiliaProdutosProps[];
}

// Dados mockados — sem requisição real até existir uma API própria do módulo de compras.
export async function getFamilias(): Promise<FamiliasResponse> {
  return { familias_produtos: familiasData as FamiliaProdutosProps[] };
}
