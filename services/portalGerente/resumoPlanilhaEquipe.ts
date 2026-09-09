import { apiFetch } from '@/lib/api/fetchHelper';
import { LinhaResumoPlanilhaProps } from '@/lib/api/dashboardEquipeDomain';

export interface ResumoPlanilhaEquipeResponse {
  data: LinhaResumoPlanilhaProps[];
}

interface GetResumoPlanilhaEquipeParams {
  mes?: number;
  ano?: number;
}

export async function getResumoPlanilhaEquipe(params: GetResumoPlanilhaEquipeParams = {}) {
  const query = new URLSearchParams();
  if (params.mes) query.set('mes', String(params.mes));
  if (params.ano) query.set('ano', String(params.ano));
  return apiFetch<ResumoPlanilhaEquipeResponse>(
    `/api/pedidos-equipe/resumo?${query}`,
    'Erro ao buscar resumo de pedidos da equipe'
  );
}
