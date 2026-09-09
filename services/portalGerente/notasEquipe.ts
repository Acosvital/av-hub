import { apiFetch } from '@/lib/api/fetchHelper';
import { NotaPlanilhaProps } from '@/app/(protected)/notas-equipe/types';
import { PaginatedResponse } from '../types';

interface GetNotasEquipeParams {
  page?: number;
  limit?: number;
  numero_nf?: string;
  numero_pedido?: string;
  data_inicio?: string;
  data_fim?: string;
  denegado?: boolean;
  faturado?: boolean;
  cancelado?: boolean;
  devolvido?: boolean;
  devolucao_parcial?: boolean;
  manual_nf?: boolean;
  // Linha da cascata de deduções (G1-G6/LIQUIDO) — ver GRUPO_FILTRO_LABEL em
  // app/(protected)/notas-equipe/page.tsx. Não é sinônimo dos flags booleanos
  // acima: a API avisa que grupo=G1 e cancelado=true podem devolver
  // conjuntos diferentes (a cascata tem precedência, ex. manual vence tudo).
  grupo?: string;
}

export interface NotasEquipeResponse extends PaginatedResponse {
  data: NotaPlanilhaProps[];
}

export async function getNotasEquipe(params: GetNotasEquipeParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.numero_nf) query.set('numero_nf', params.numero_nf);
  if (params.numero_pedido) query.set('numero_pedido', params.numero_pedido);
  if (params.data_inicio) query.set('data_inicio', params.data_inicio);
  if (params.data_fim) query.set('data_fim', params.data_fim);
  (['denegado', 'faturado', 'cancelado', 'devolvido', 'devolucao_parcial', 'manual_nf'] as const).forEach(
    (flag) => {
      if (params[flag] !== undefined) query.set(flag, String(params[flag]));
    }
  );
  if (params.grupo) query.set('grupo', params.grupo);
  return apiFetch<NotasEquipeResponse>(
    `/api/notas-equipe?${query}`,
    'Erro ao buscar notas fiscais da equipe'
  );
}
