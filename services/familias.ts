import { apiFetch } from '@/lib/api/fetchHelper';
import { FamiliaProdutosProps } from '@/app/(protected)/orcamento/historico-produtos/types';

interface FamiliasResponse {
  familias_produtos: FamiliaProdutosProps[];
}

export async function getFamilias() {
  return apiFetch<FamiliasResponse>('/api/familias', 'Erro ao buscar famílias de produtos');
}
