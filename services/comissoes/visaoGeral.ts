import { apiFetch } from '@/lib/api/fetchHelper';
import { VisaoGeralComissaoRow } from '@/app/(protected)/comissoes/visao-geral/types';

interface GetVisaoGeralComissoesParams {
  mes?: number;
  ano?: number;
  pedido?: string;
  cliente?: string;
  vendedor?: string;
  page?: number;
  limit?: number;
}

interface VisaoGeralComissoesResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: VisaoGeralComissaoRow[];
}

// Chama a rota Next (/api/comissoes/visao-geral), não a api-avhub direto —
// mesmo padrão de todo `services/*` do projeto (ver services/vendas/*.ts).
export async function getVisaoGeralComissoes(params: GetVisaoGeralComissoesParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  if (params.pedido) query.set('pedido', params.pedido);
  if (params.cliente) query.set('cliente', params.cliente);
  if (params.vendedor) query.set('vendedor', params.vendedor);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  return apiFetch<VisaoGeralComissoesResponse>(
    `/api/comissoes/visao-geral?${query}`,
    'Erro ao buscar visão geral de comissões'
  );
}
